package ch.salon.service;

import ch.salon.domain.Conference;
import ch.salon.domain.Invoice;
import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.Participation;
import ch.salon.domain.PriceStandSalon;
import ch.salon.domain.Salon;
import ch.salon.domain.Stand;
import ch.salon.domain.Workshop;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.ModePaymentMeals;
import ch.salon.domain.enumeration.State;
import ch.salon.domain.enumeration.Status;
import ch.salon.domain.enumeration.Type;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.StandRepository;
import ch.salon.repository.WorkshopRepository;
import io.micrometer.common.util.StringUtils;
import lombok.AllArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import static ch.salon.domain.enumeration.Type.CONFERENCE;
import static ch.salon.domain.enumeration.Type.MEAL1;
import static ch.salon.domain.enumeration.Type.MEAL2;
import static ch.salon.domain.enumeration.Type.MEAL3;
import static ch.salon.domain.enumeration.Type.POSTAL_FEE;
import static ch.salon.domain.enumeration.Type.SHARED;
import static ch.salon.domain.enumeration.Type.STAND;
import static ch.salon.domain.enumeration.Type.WORKSHOP;

@Service
@AllArgsConstructor
public class RefreshInvoicingPlansService {
    public static final String ENTITY_NAME = "invoicingPlan";
    private static final double EPSILON_TOTAL = 0.01;

    private final InvoicingPlanRepository repository;

    private final SalonRepository salonRepository;
    private final ParticipationRepository participationRepository;
    private final InvoicingPlanService invoicingPlanService;
    private final StandRepository standRepository;
    private final ConferenceRepository conferenceRepository;
    private final WorkshopRepository workshopRepository;
    private final MessageSource messageSource;
    private final EventLogService eventLogService;

    /**
     * Recalcule les plans de facturation pour une participation.
     * <p>
     * Algo (high level) :
     * 1. Charge la participation, le salon, les stands/conf/workshops actifs.
     * 2. Récupère tous les plans actifs (non annulé).
     * 3. Calcule la "couverture" de facturation de la participation globale :
     * - expected = tout ce qui DEVRAIT être facturé (stands, shared, conf, ws, repas, postal...)
     * - existing = tout ce qui EST déjà facturé (uniquement plans non-brouillons)
     * - differences = expected VS existing
     * 4. Si pas de différence → on ne fait rien.
     * 5. Sinon, on prend (ou crée) le dernier brouillon et on y ajoute :
     * - soit des lignes de diff simples (delta quantité / delta prix)
     * - soit, pour un STAND dont la dimension change, une annulation + une nouvelle ligne
     * 6. Si les repas doivent être séparés, on isole les lignes MEAL1/2/3 dans un plan ISOLATED.
     * 7. On nettoie les brouillons vides et on met à jour les frais postaux si nécessaire.
     */
    @Transactional
    public void refreshInvoicingPlans(String idParticipation) {
        if (StringUtils.isBlank(idParticipation)) {
            throw new IllegalStateException("No idParticipation given");
        }

        UUID participationId = UUID.fromString(idParticipation);
        Participation participation = participationRepository.findById(participationId).orElseThrow();

        if (participation.getStatus() == Status.CLOSED) {
            // Participation clôturée -> on ne touche plus à la facturation.
            return;
        }

        // Tous les plans actifs de la participation (non annulés)
        List<InvoicingPlan> activePlans =
                repository.findByParticipationIdOrderByBillingNumberAsc(participationId).stream()
                          .filter(plan -> plan.getState() != State.CANCELLED).toList();

        // Calcul des différences à appliquer
        InvoiceCoverage coverage = computeInvoiceCoverage(participation, activePlans);

        // Si tous les éléments attendus sont présents et qu'aucune différence (montant / quantité) -> rien à faire
        if (coverage.isAllElementsPresent() && coverage.getDifferences().isEmpty()) {
            return;
        }

        // FIX ME : Si tous les plans ont été annulés, le billing number va recommencer à 0
        InvoicingPlan lastPlan =
                activePlans.stream().max(Comparator.comparing(InvoicingPlan::getBillingNumber)).orElse(null);
        InvoicingPlan lastDraftPlan =
                repository.findFirstByParticipationIdAndStateOrderByBillingNumberDesc(participationId, State.DRAFT);

        // Sélection ou création du brouillon courant
        InvoicingPlan currentDraft = selectOrCreateCurrentDraft(participation, lastPlan, lastDraftPlan);

        long position =
                currentDraft.getInvoices().stream().mapToLong(inv -> inv.getPosition() != null ? inv.getPosition() : 0L)
                            .max().orElse(0L);

        // Application des différences dans le brouillon courant
        applyDifferencesToDraft(currentDraft, coverage.getDifferences(), position);

        var isNew = currentDraft.getId() == null;

        currentDraft = repository.save(currentDraft);

        if (isNew){
            this.eventLogService.eventFromSystem("Facture crée", EventType.EVENT, EntityType.INVOICE_PLAN,
                    currentDraft.getId(), null);
        } else {
            this.eventLogService.eventFromSystem("Facture rafraîchie", EventType.EVENT, EntityType.INVOICE_PLAN,
                    currentDraft.getId(), null);
        }

        // Séparation des repas si nécessaire (MEAL1/2/3 dans un plan ISOLATED)
        if (participation.getModePaymentMeals() == ModePaymentMeals.SEPARATE) {
            isolateMealInvoicesIfNeeded(currentDraft, participation);
        }

        // Nettoyage des brouillons vides (DRAFT / ISOLATED)
        cleanupDraftPlans(activePlans);

        // Gestion automatique des frais postaux (ajout / suppression POSTAL_FEE)
        if (currentDraft.getInvoices().isEmpty()) {
            repository.delete(currentDraft);
        } else {
            // On applique d'abord la logique des frais postaux (ajout / retrait POSTAL_FEE)
            invoicingPlanService.manageInvoiceSendingMethod(currentDraft);

            if (currentDraft.getInvoices().isEmpty()) {
                repository.delete(currentDraft);
            } else {
                // Puis on trie et renumérote AVANT la sauvegarde finale
                sortAndReindexInvoices(currentDraft);
                repository.save(currentDraft);
            }
        }
    }

    /**
     * Sélectionne le brouillon courant (dernier DRAFT s'il existe), ou en crée un nouveau.
     * <p>
     * Exemples :
     * - Aucun plan existant :
     * clientNumber = "123-001" => création plan "123-001"
     * - Des plans finalisés existent, mais aucun DRAFT :
     * dernier plan "123-001" => nouveau DRAFT "123-002"
     * - Un DRAFT existe déjà :
     * on le réutilise.
     */
    private InvoicingPlan selectOrCreateCurrentDraft(Participation participation, InvoicingPlan lastPlan,
            InvoicingPlan lastDraftPlan) {
        InvoicingPlan current;
        if (lastPlan == null) {
            // Premier plan de la participation
            current = createNewDraftPlan(participation, participation.getClientNumber() + "-001");
        } else if (lastDraftPlan != null) {
            // On réutilise le dernier brouillon
            current = lastDraftPlan;
        } else {
            // On crée un nouveau brouillon après le dernier plan finalisé
            current = createNewDraftPlan(participation, incrementBillingNumber(lastPlan.getBillingNumber()));
        }

        current.setGenerationDate(Instant.now());
        current.setNeedArrangement(participation.getNeedArrangement());
        current.setInvoiceSendingMethod(participation.getInvoiceSendingMethod());

        return current;
    }

    /**
     * Applique la liste des différences dans le brouillon courant.
     * <p>
     * - Cas générique :
     * deltaQuantity != 0 -> on crée une ligne avec quantité = |deltaQuantity|
     * montant unitaire = +/- prix salon
     * deltaQuantity == 0 -> on crée une ligne avec quantité = 1
     * montant = deltaTotal (ex : correction de prix)
     * <p>
     * - Cas spécial STAND :
     * si seule le prix change (quantité identique) :
     * 1) créer une ligne "Rectif. : <label>" avec -existingTotal
     * 2) créer une nouvelle ligne STAND avec le nouveau prix.
     * <p>
     * Exemple :
     * - SHARED 50.- payé, shared=false maintenant :
     * expectedTotal = 0
     * existingTotal = 50
     * deltaTotal    = -50  => ligne de -50 dans le brouillon
     */
    private void applyDifferencesToDraft(InvoicingPlan draft, List<InvoiceDiff> differences, long lastPosition) {

        long position = lastPosition;

        for (InvoiceDiff diff : differences) {
            InvoiceExpected expected = diff.expected();

            double expectedTotal = expected.getExpectedTotal();
            double existingTotal = diff.existingTotal();
            long expectedQty = expected.quantity();
            long existingQty = diff.existingQuantity();

            boolean quantityRelevant = isQuantityRelevant(expected.type());

            double deltaTotal = expectedTotal - existingTotal;
            long deltaQuantity = quantityRelevant ? (expectedQty - existingQty) : 0L;

            if (Math.abs(deltaTotal) < EPSILON_TOTAL && deltaQuantity == 0L) {
                continue;
            }

            // Cas spécial STAND : seul le prix change (quantité identique)
            if (expected.type() == STAND && deltaQuantity == 0L && Math.abs(existingTotal) > EPSILON_TOTAL &&
                    Math.abs(deltaTotal) > EPSILON_TOTAL) {

                // 1) Annulation de l'ancien montant du stand
                position += 1;
                Invoice cancel = new Invoice();
                cancel.setPosition(position);
                cancel.setReferenceId(expected.referenceId());
                cancel.setLock(false);
                cancel.setGenerationDate(Instant.now());
                cancel.setReduction(false);
                cancel.setType(STAND);

                String baseLabel = diff.existingLabel() != null ? diff.existingLabel() : expected.label();
                cancel.setLabel(sub("Rectif. : " + baseLabel));
                cancel.setQuantity(1L);
                cancel.setDefaultAmount(-existingTotal);
                cancel.setCustomAmount(-existingTotal);

                draft.getInvoices().add(cancel);

                // 2) Nouvelle ligne du stand avec le nouveau prix
                position += 1;
                Invoice newStand = new Invoice();
                newStand.setPosition(position);
                newStand.setReferenceId(expected.referenceId());
                newStand.setLock(false);
                newStand.setGenerationDate(Instant.now());
                newStand.setType(STAND);
                newStand.setReduction(false);
                newStand.setLabel(sub(expected.label()));
                newStand.setQuantity(expectedQty);
                newStand.setDefaultAmount(expected.unitPrice());
                newStand.setCustomAmount(expected.unitPrice());

                draft.getInvoices().add(newStand);
                continue;
            }

            // Cas générique
            position += 1;
            Invoice invoice = new Invoice();
            invoice.setPosition(position);
            invoice.setReferenceId(expected.referenceId());
            invoice.setLock(false);
            invoice.setReduction(false);
            invoice.setGenerationDate(Instant.now());
            invoice.setType(expected.type());
            invoice.setLabel(sub(expected.label()));

            if (deltaQuantity != 0L) {
                long qty = Math.abs(deltaQuantity);
                double unitAmount = expected.unitPrice();
                if (deltaQuantity < 0) {
                    unitAmount = -unitAmount;
                }
                invoice.setQuantity(qty);
                invoice.setDefaultAmount(unitAmount);
                invoice.setCustomAmount(unitAmount);
            } else {
                invoice.setQuantity(1L);
                invoice.setDefaultAmount(deltaTotal);
                invoice.setCustomAmount(deltaTotal);
            }

            draft.getInvoices().add(invoice);
        }
    }

    /**
     * Si les repas doivent être séparés (ModePaymentMeals.SEPARATE),
     * on déplace toutes les lignes MEAL1/2/3 du brouillon courant
     * dans un nouveau plan ISOLATED.
     * <p>
     * Exemple :
     * - Brouillon courant contient :
     * MEAL1 x2 (40.-), STAND (300.-)
     * - ModePaymentMeals = SEPARATE
     * => création plan ISOLATED avec MEAL1 x2,
     * le brouillon courant garde seulement STAND.
     */
    private void isolateMealInvoicesIfNeeded(InvoicingPlan currentDraft, Participation participation) {
        List<Invoice> meals = currentDraft.getInvoices().stream()
                                          .filter(inv -> inv.getType() == MEAL1 || inv.getType() == MEAL2 ||
                                                  inv.getType() == MEAL3).toList();

        if (meals.isEmpty()) {
            return;
        }

        invoicingPlanService.splitInvoicingPlan(currentDraft.getId(), meals.stream().map(Invoice::getId).toList(), true,
                // forceWithArrangment
                true    // forceWithEmailMethod (on force EMAIL pour les plans repas isolés)
        );
    }

    /**
     * Supprime les brouillons vides (DRAFT / ISOLATED),
     * sinon les sauvegarde tels quels.
     */
    private void cleanupDraftPlans(List<InvoicingPlan> activePlans) {
        activePlans.stream().filter(plan -> plan.getState().isDraft()).forEach(draft -> {
            if (draft.getInvoices().isEmpty()) {
                repository.delete(draft);
            } else {
                // On applique d'abord la logique des frais postaux (ajout / retrait POSTAL_FEE)
                invoicingPlanService.manageInvoiceSendingMethod(draft);

                if (draft.getInvoices().isEmpty()) {
                    repository.delete(draft);
                } else {
                    // Puis on trie et renumérote AVANT la sauvegarde finale
                    sortAndReindexInvoices(draft);
                    repository.save(draft);
                }
            }
        });
    }

    /**
     * Calcule la "couverture" de facturation :
     * - expected = tout ce qui devrait être facturé
     * - existing = tout ce qui est déjà facturé (uniquement sur plans non-brouillons)
     * - differences = liste de InvoiceDiff à appliquer (positive ou négative).
     * <p>
     * IMPORTANT :
     * - Avant de calculer existing, on nettoie les brouillons :
     * -> on supprime toutes les lignes "managed" (STAND, SHARED, CONF, WORKSHOP, MEAL1/2/3)
     * afin que le refresh réécrive proprement ces lignes dans le brouillon courant.
     * - Nous n'utilisons pas ici les delta* d'InvoiceDiff dans le refresh :
     * ils sont recalculés dans applyDifferencesToDraft().
     */
    private InvoiceCoverage computeInvoiceCoverage(Participation participation, List<InvoicingPlan> activePlans) {

        Salon salon = salonRepository.findById(participation.getSalon().getId()).orElseThrow();

        Status[] statuses = Status.getActiveStatuses();

        // Récupération des entités "source" (stands, conf, ateliers) encore valides
        List<Stand> activeStands =
                standRepository.findByParticipationIdAndStatusInOrderByRegistrationDateDesc(participation.getId(), statuses);
        List<Conference> activeConferences =
                conferenceRepository.findByParticipationIdAndStatusInOrderByRegistrationDateDesc(participation.getId(),
                        statuses);
        List<Workshop> activeWorkshops =
                workshopRepository.findByParticipationIdAndStatusInOrderByRegistrationDateDesc(participation.getId(),
                        statuses);

        // Séparer brouillons vs plans "finalisés"
        List<InvoicingPlan> draftPlans = activePlans.stream().filter(plan -> plan.getState().isDraft()).toList();
        List<InvoicingPlan> finalPlans = activePlans.stream().filter(plan -> !plan.getState().isDraft()).toList();

        // 1) Construire la map des éléments attendus
        var expectedMap = buildExpectedInvoices(participation, salon, activeStands, activeConferences, activeWorkshops);

        // 2) Nettoyer les brouillons : on enlève tous les types "managed"
        cleanDraftInvoices(draftPlans);

        // 3) Totaux, quantités et labels déjà facturés (UNIQUEMENT plans non-brouillons)
        var existingTotals = new java.util.HashMap<InvoiceKey, Double>();
        var existingQuantities = new java.util.HashMap<InvoiceKey, Long>();
        var existingLabels = new java.util.HashMap<InvoiceKey, String>();

        for (InvoicingPlan plan : finalPlans) {
            for (Invoice inv : plan.getInvoices()) {
                if (!isManagedInvoiceType(inv.getType())) {
                    continue;
                }

                InvoiceKey key = new InvoiceKey(inv.getType(), inv.getReferenceId());
                double total = inv.getTotalAmount();

                existingTotals.merge(key, total, Double::sum);

                long qty = inv.getQuantity() != null ? inv.getQuantity() : 1L;
                if (isQuantityRelevant(inv.getType()) && total < 0.0) {
                    // Pour les repas, on signe la quantité en fonction du montant
                    // ex: MEAL1 x2 à -20 => quantité -2
                    qty = -qty;
                }
                existingQuantities.merge(key, qty, Long::sum);

                existingLabels.put(key, inv.getLabel());
            }
        }

        // 4) Comparaison montants + quantités pour les éléments attendus
        boolean allElementsPresent = true;
        List<InvoiceDiff> diffs = new java.util.ArrayList<>();
        final double EPS = EPSILON_TOTAL;

        for (InvoiceExpected expected : expectedMap.values()) {
            InvoiceKey key = new InvoiceKey(expected.type(), expected.referenceId());

            double existingTotal = existingTotals.getOrDefault(key, 0.0);
            long existingQty = existingQuantities.getOrDefault(key, 0L);
            String existingLabel = existingLabels.get(key);

            long expectedQty = expected.quantity();
            double expectedTotal = expected.getExpectedTotal();

            boolean quantityRelevant = isQuantityRelevant(expected.type());

            if (Math.abs(existingTotal) < EPS && expectedTotal != 0.0) {
                // Exemple : stand attendu 300.-, pas encore facturé -> élément manquant
                allElementsPresent = false;
            }

            double deltaTotal = expectedTotal - existingTotal;
            long deltaQty = quantityRelevant ? (expectedQty - existingQty) : 0L;

            if (Math.abs(deltaTotal) > EPS || (quantityRelevant && deltaQty != 0L)) {
                diffs.add(new InvoiceDiff(expected, existingTotal, existingQty, deltaTotal, deltaQty, existingLabel));
            }
        }

        // 5) Éléments facturés mais plus attendus
        //   Exemple : SHARED 50.- existant, shared=false maintenant -> expected=0 => delta=-50
        for (var entry : existingTotals.entrySet()) {
            InvoiceKey key = entry.getKey();

            if (!isManagedInvoiceType(key.type())) {
                continue;
            }

            if (expectedMap.containsKey(key)) {
                continue; // déjà traité
            }

            double existingTotal = entry.getValue();
            if (Math.abs(existingTotal) < EPS) {
                continue;
            }

            long existingQty = existingQuantities.getOrDefault(key, 0L);
            String existingLabel = existingLabels.get(key);
            Type type = key.type();
            boolean quantityRelevant = isQuantityRelevant(type);

            // expected "virtuel" à 0 (on annule tout ce qui existe)
            InvoiceExpected expected =
                    new InvoiceExpected(type, key.referenceId(), existingLabel != null ? existingLabel : "", 0L,
                            0.0);

            double deltaTotal = -existingTotal;              // ex: 50 => -50
            long deltaQty = quantityRelevant ? -existingQty : 0L;

            diffs.add(new InvoiceDiff(expected, existingTotal, existingQty, deltaTotal, deltaQty, existingLabel));
        }

        return new InvoiceCoverage(allElementsPresent, diffs);
    }

    /**
     * Construit la map des éléments "attendus" (InvoiceExpected) pour une participation.
     * <p>
     * Clé = (type, referenceId)
     * - STAND : ref = stand.id
     * - SHARED : ref = stand.id
     * - CONFERENCE : ref = conf.id
     * - WORKSHOP : ref = ws.id
     * - MEAL1/2/3 : ref = null
     * - POSTAL_FEE : ref = null
     */
    private java.util.Map<InvoiceKey, InvoiceExpected> buildExpectedInvoices(Participation participation, Salon salon,
            List<Stand> validStands, List<Conference> validConferences, List<Workshop> validWorkshops) {

        var expectedMap = new java.util.HashMap<InvoiceKey, InvoiceExpected>();

        // STANDS + SHARED
        for (Stand stand : validStands) {
            Double standPrice = stand.getDimension() == null ? 0.0 : salon.getPriceStandSalons().stream()
                                                                          .filter(priceStand -> priceStand.getId()
                                                                                                          .equals(stand.getDimension()
                                                                                                                       .getId()))
                                                                          .findFirst().map(PriceStandSalon::getPrice)
                                                                          .orElse(0.0);

            Object[] args = {(stand.getDimension() != null ? stand.getDimension().getDimension() : "")};
            String standLabel = messageSource.getMessage("invoice.stand.label", args, Locale.FRENCH);

            InvoiceExpected standExpected = new InvoiceExpected(STAND, stand.getId(), standLabel, 1L, standPrice);
            expectedMap.put(new InvoiceKey(STAND, stand.getId()), standExpected);

            if (Boolean.TRUE.equals(stand.getShared())) {
                String sharedLabel = messageSource.getMessage("invoice.shared.label", args, Locale.FRENCH);
                InvoiceExpected sharedExpected =
                        new InvoiceExpected(SHARED, stand.getId(), sharedLabel, 1L, salon.getPriceSharingStand());
                expectedMap.put(new InvoiceKey(SHARED, stand.getId()), sharedExpected);
            }
        }

        // CONFERENCES
        String confLabel = messageSource.getMessage("invoice.conference.label", null, Locale.FRENCH);
        for (Conference conference : validConferences) {
            InvoiceExpected confExpected =
                    new InvoiceExpected(CONFERENCE, conference.getId(), confLabel, 1L, salon.getPriceConference());
            expectedMap.put(new InvoiceKey(CONFERENCE, conference.getId()), confExpected);
        }

        // WORKSHOPS
        String wsLabel = messageSource.getMessage("invoice.workshop.label", null, Locale.FRENCH);
        for (Workshop workshop : validWorkshops) {
            InvoiceExpected wsExpected =
                    new InvoiceExpected(WORKSHOP, workshop.getId(), wsLabel, 1L, salon.getPriceWorkshop());
            expectedMap.put(new InvoiceKey(WORKSHOP, workshop.getId()), wsExpected);
        }

        // MEALS (refId = null) – présents même avec quantité 0 (pour gérer le cas "je mets à 0")
        Long nbMeal1 = participation.getNbMeal1() != null ? participation.getNbMeal1() : 0L;
        String labelM1 = messageSource.getMessage("invoice.saturday-midday.label", null, Locale.FRENCH);
        InvoiceExpected m1Expected = new InvoiceExpected(MEAL1, null, labelM1, nbMeal1, salon.getPriceMeal1());
        expectedMap.put(new InvoiceKey(MEAL1, null), m1Expected);

        Long nbMeal2 = participation.getNbMeal2() != null ? participation.getNbMeal2() : 0L;
        String labelM2 = messageSource.getMessage("invoice.saturday-evening.label", null, Locale.FRENCH);
        InvoiceExpected m2Expected = new InvoiceExpected(MEAL2, null, labelM2, nbMeal2, salon.getPriceMeal2());
        expectedMap.put(new InvoiceKey(MEAL2, null), m2Expected);

        Long nbMeal3 = participation.getNbMeal3() != null ? participation.getNbMeal3() : 0L;
        String labelM3 = messageSource.getMessage("invoice.sunday-midday.label", null, Locale.FRENCH);
        InvoiceExpected m3Expected = new InvoiceExpected(MEAL3, null, labelM3, nbMeal3, salon.getPriceMeal3());
        expectedMap.put(new InvoiceKey(MEAL3, null), m3Expected);

        return expectedMap;
    }

    /**
     * Trie les lignes d'un plan selon :
     * 1) l'ordre de type (voir getInvoiceTypeOrder)
     * 2) l'ancienne position (pour garder un ordre stable à l'intérieur d'un même type)
     * Et renumérote les positions (1,2,3,...) après tri.
     * <p>
     * Exemple :
     * Avant :
     * pos 3 : MEAL1
     * pos 1 : STAND
     * pos 2 : CUSTOM
     * Après tri :
     * pos 1 : STAND
     * pos 2 : CUSTOM
     * pos 3 : MEAL1
     */
    private void sortAndReindexInvoices(InvoicingPlan plan) {
        if (plan.getInvoices() == null || plan.getInvoices().isEmpty()) {
            return;
        }

        List<Invoice> sorted = plan.getInvoices().stream()
                                   .sorted(Comparator.comparingInt((Invoice inv) -> getInvoiceTypeOrder(inv.getType()))
                                                     .thenComparing(
                                                             inv -> inv.getPosition() != null ? inv.getPosition() : 0L))
                                   .toList();

        long pos = 1L;
        for (Invoice invoice : sorted) {
            invoice.setPosition(pos++);
        }

        // On remplace le Set/List existant par la liste triée.
        plan.getInvoices().clear();
        plan.getInvoices().addAll(sorted);
    }

    private int getInvoiceTypeOrder(Type type) {
        return switch (type) {
            case STAND -> 100;
            case SHARED -> 200;
            case CONFERENCE -> 300;
            case WORKSHOP -> 400;
            case MEAL1 -> 600;
            case MEAL2 -> 700;
            case MEAL3 -> 800;
            case POSTAL_FEE -> 900;
            default ->
                // Ceux définis par l'utilisateur (CUSTOM)
                    500; // entre WORKSHOP et MEAL1
        };
    }

    /**
     * Supprime toutes les lignes "managed" dans les brouillons (DRAFT / ISOLATED).
     * <p>
     * Types "managed" = STAND, SHARED, CONFERENCE, WORKSHOP, MEAL1, MEAL2, MEAL3
     * <p>
     * Exemple :
     * - Brouillon avec :
     * STAND 300
     * CUSTOM "Remise spéciale -20"
     * => après nettoyage :
     * CUSTOM "Remise spéciale -20"
     * (le refresh va recréer le STAND 300 dans le brouillon courant)
     */
    private void cleanDraftInvoices(List<InvoicingPlan> draftPlans) {
        for (InvoicingPlan plan : draftPlans) {
            boolean modified = plan.getInvoices().removeIf(inv -> isTypeToRemoveInDraft(inv.getType()));
            if (modified) {
                repository.save(plan);
            }
        }
    }

    private boolean isQuantityRelevant(Type type) {
        // La quantité "métier" et les deltas de quantité ne sont significatifs que pour les repas.
        return type == MEAL1 || type == MEAL2 || type == MEAL3;
    }

    private boolean isManagedInvoiceType(Type type) {
        // Types gérés automatiquement par le refresh.
        // Remarque : POSTAL_FEE est piloté par manageInvoiceSendingMethod().
        return type == STAND || type == SHARED || type == CONFERENCE || type == WORKSHOP || type == MEAL1 ||
                type == MEAL2 || type == MEAL3;
    }

    private boolean isTypeToRemoveInDraft(Type type) {
        return isManagedInvoiceType(type) || type == POSTAL_FEE;
    }

    private InvoicingPlan createNewDraftPlan(Participation participation, String billingNumber) {
        InvoicingPlan plan = new InvoicingPlan();
        plan.setState(State.DRAFT);
        plan.setParticipation(participation);
        plan.setBillingNumber(billingNumber);
        return plan;
    }

    private String incrementBillingNumber(String billingNumber) {
        String[] parts = billingNumber.split("-");
        String prefix1 = parts[0];
        String prefix2 = parts[1];
        String numberPart = parts[2];

        int number = Integer.parseInt(numberPart);
        number++;

        String newNumberPart = String.format("%03d", number);
        return prefix1 + "-" + prefix2 + "-" + newNumberPart;
    }

    private String sub(String chaine) {
        return chaine != null ? chaine.substring(0, Math.min(40, chaine.length())) : null;
    }
}
