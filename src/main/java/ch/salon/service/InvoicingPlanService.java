package ch.salon.service;

import ch.salon.domain.Conference;
import ch.salon.domain.Invoice;
import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.Participation;
import ch.salon.domain.Payment;
import ch.salon.domain.PriceStandSalon;
import ch.salon.domain.Salon;
import ch.salon.domain.Stand;
import ch.salon.domain.Workshop;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.domain.enumeration.ModePaymentMeals;
import ch.salon.domain.enumeration.State;
import ch.salon.domain.enumeration.Status;
import ch.salon.domain.enumeration.Type;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.InvoiceRepository;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.PaymentRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.StandRepository;
import ch.salon.repository.WorkshopRepository;
import ch.salon.service.dto.InvoiceDTO;
import ch.salon.service.dto.InvoicingPlanDTO;
import ch.salon.service.dto.PaymentDTO;
import ch.salon.service.mapper.InvoiceMapper;
import ch.salon.service.mapper.InvoicingPlanMapper;
import ch.salon.service.mapper.PaymentMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static ch.salon.domain.enumeration.EntityType.INVOICE_PLAN;
import static ch.salon.domain.enumeration.EntityType.PARTICIPATION;
import static ch.salon.domain.enumeration.Type.CONFERENCE;
import static ch.salon.domain.enumeration.Type.MEAL1;
import static ch.salon.domain.enumeration.Type.MEAL2;
import static ch.salon.domain.enumeration.Type.MEAL3;
import static ch.salon.domain.enumeration.Type.POSTAL_FEE;
import static ch.salon.domain.enumeration.Type.SHARED;
import static ch.salon.domain.enumeration.Type.STAND;
import static ch.salon.domain.enumeration.Type.WORKSHOP;

@Service
public class InvoicingPlanService {

    public static final String ENTITY_NAME = "invoicingPlan";
    private final EventLogService eventLogService;

    private final InvoicingPlanRepository repository;

    private final SalonRepository salonRepository;
    private final ParticipationRepository participationRepository;

    private final StandRepository standRepository;
    private final ConferenceRepository conferenceRepository;
    private final WorkshopRepository workshopRepository;

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    private final MessageSource messageSource;

    public InvoicingPlanService(SalonRepository salonRepository, ParticipationRepository participationRepository,
            InvoicingPlanRepository repository, StandRepository standRepository, WorkshopRepository workshopRepository,
            ConferenceRepository conferenceRepository, MessageSource messageSource, EventLogService eventLogService,
            PaymentRepository paymentRepository, InvoiceRepository invoiceRepository) {
        this.participationRepository = participationRepository;
        this.salonRepository = salonRepository;
        this.repository = repository;
        this.standRepository = standRepository;
        this.conferenceRepository = conferenceRepository;
        this.workshopRepository = workshopRepository;
        this.messageSource = messageSource;
        this.eventLogService = eventLogService;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public Optional<InvoiceDTO> createInvoice(UUID idInvoicingPlan, InvoiceDTO invoiceDTO) {
        if (idInvoicingPlan == null || invoiceDTO == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = repository.findById(idInvoicingPlan).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        Invoice invoiceToCreate = InvoiceMapper.INSTANCE.toEntity(invoiceDTO);
        invoiceToCreate.setDefaultAmount(invoiceDTO.getCustomAmount());
        invoiceToCreate.setReduction(invoiceToCreate.getTotalAmount() < 0.00);
        invoiceToCreate = this.invoiceRepository.save(invoiceToCreate);

        invoicingPlan.addInvoice(invoiceToCreate);
        invoicingPlan = repository.save(invoicingPlan);

        this.eventLogService.eventFromSystem("Une ligne de facture a été ajoutée " + invoicingPlan.getBillingNumber(),
                EventType.ACTION, PARTICIPATION, invoicingPlan.getParticipation().getId(), null);
        this.eventLogService.eventFromSystem("Une ligne de facture a été ajoutée", EventType.ACTION, INVOICE_PLAN,
                invoicingPlan.getId(), null);

        return Optional.of(InvoiceMapper.INSTANCE.toDto(invoiceToCreate));
    }

    public Optional<InvoiceDTO> updateInvoice(UUID idInvoicingPlan, UUID idInvoice, InvoiceDTO invoiceDTO) {
        if (idInvoicingPlan == null || invoiceDTO == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = repository.findById(idInvoicingPlan).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        Invoice invoiceFound =
                invoicingPlan.getInvoices().stream().filter(invoice -> invoice.getId().equals(idInvoice)).findFirst()
                             .orElseThrow();

        if (!Objects.equals(invoiceFound.getCustomAmount(), invoiceDTO.getCustomAmount())) {
            this.eventLogService.eventFromSystem(
                    "Une ligne de facture a été modifiée #" + invoicingPlan.getBillingNumber(), EventType.ACTION,
                    PARTICIPATION, invoicingPlan.getParticipation().getId(), null);
            this.eventLogService.eventFromSystem("Une ligne de facture a été modifiée", EventType.ACTION, INVOICE_PLAN,
                    invoicingPlan.getId(), null);
        }

        invoiceFound.setLabel(invoiceDTO.getLabel());
        invoiceFound.setDefaultAmount(invoiceDTO.getDefaultAmount());
        invoiceFound.setCustomAmount(invoiceDTO.getCustomAmount());
        invoiceFound.setGenerationDate(Instant.now());
        invoiceFound.setExtraInformation(invoiceDTO.getExtraInformation());
        invoiceFound.setLock(invoiceDTO.getLock());
        invoiceFound.setReduction(invoiceFound.getTotalAmount() < 0.00);

        repository.save(invoicingPlan);

        return Optional.of(InvoiceMapper.INSTANCE.toDto(invoiceFound));
    }

    public Optional<PaymentDTO> createPayment(UUID idInvoicingPlan, PaymentDTO paymentDTO) {
        if (paymentDTO.getId() != null) {
            throw new BadRequestAlertException("A new payment cannot already have an ID", ENTITY_NAME, "id.exists");
        }

        InvoicingPlan invoicingPlan = repository.getReferenceById(idInvoicingPlan);
        Payment payment = PaymentMapper.INSTANCE.toEntity(paymentDTO);
        payment = this.paymentRepository.save(payment);

        invoicingPlan.addPayment(payment);
        invoicingPlan = this.repository.save(invoicingPlan);

        this.eventLogService.eventFromSystem("Un paiement a été ajouté " + invoicingPlan.getBillingNumber(),
                EventType.PAYMENT, PARTICIPATION, invoicingPlan.getParticipation().getId(), null);
        this.eventLogService.eventFromSystem("Un paiement a été ajouté", EventType.PAYMENT, INVOICE_PLAN,
                invoicingPlan.getId(), null);

        return Optional.of(PaymentMapper.INSTANCE.toDto(payment));
    }

    public Optional<PaymentDTO> updatePayment(final UUID idInvoicingPlan, final UUID idPayment, PaymentDTO paymentDTO) {
        if (idPayment == null || paymentDTO == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = repository.findById(idInvoicingPlan).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        Payment paymentFound =
                invoicingPlan.getPayments().stream().filter(payment -> payment.getId().equals(idPayment)).findFirst()
                             .orElseThrow();

        if (!Objects.equals(paymentDTO.getAmount(), paymentFound.getAmount())) {
            this.eventLogService.eventFromSystem("Un paiement a été modifié " + invoicingPlan.getBillingNumber(),
                    EventType.PAYMENT, PARTICIPATION, invoicingPlan.getParticipation().getId(), null);
            this.eventLogService.eventFromSystem("Un paiement a été modifié", EventType.PAYMENT, INVOICE_PLAN,
                    invoicingPlan.getId(), null);
        }

        paymentFound.setPaymentMode(paymentDTO.getPaymentMode());
        paymentFound.setBillingDate(paymentDTO.getBillingDate());
        paymentFound.setExtraInformation(paymentDTO.getExtraInformation());
        paymentFound.setAmount(paymentDTO.getAmount());

        repository.save(invoicingPlan);

        return Optional.of(PaymentMapper.INSTANCE.toDto(paymentFound));
    }

    public void deletePayment(UUID idInvoicingPlan, UUID idPayment) {
        InvoicingPlan invoicingPlan = repository.getReferenceById(idInvoicingPlan);

        Payment paymentFound =
                invoicingPlan.getPayments().stream().filter(payment -> payment.getId().equals(idPayment)).findFirst()
                             .orElseThrow();

        invoicingPlan.removePayment(paymentFound);

        this.repository.save(invoicingPlan);
        this.eventLogService.eventFromSystem("Un paiement a été supprimé " + invoicingPlan.getBillingNumber(),
                EventType.PAYMENT, PARTICIPATION, invoicingPlan.getParticipation().getId(), null);
        this.eventLogService.eventFromSystem("Un paiement a été supprimé", EventType.PAYMENT, INVOICE_PLAN,
                invoicingPlan.getId(), null);
    }

    public List<InvoicingPlanDTO> findAll(String idParticipation) {
        if (StringUtils.isNotBlank(idParticipation)) {
            List<InvoicingPlan> invoicingPlans =
                    repository.findByParticipationIdOrderByBillingNumberAsc(UUID.fromString(idParticipation));
            return invoicingPlans.stream().map(InvoicingPlanMapper.INSTANCE::toDto).toList();
        }

        throw new IllegalStateException("No filter given");
    }

    public void switchArrangement(UUID idInvoicingPlan) {
        InvoicingPlan invoicingPlan = repository.findById(idInvoicingPlan).orElseThrow();

        if (invoicingPlan.getState() != State.DRAFT && invoicingPlan.getState() != State.ISOLATED) {
            throw new IllegalStateException("Invoicing plan must be in state Draft or Isolated to split invoices");
        }

        invoicingPlan.setNeedArrangement(!invoicingPlan.getNeedArrangement());

        this.eventLogService.eventFromSystem("Changement d'arrangement " + invoicingPlan.getBillingNumber(),
                EventType.ACTION, PARTICIPATION, invoicingPlan.getParticipation().getId(), null);
        this.eventLogService.eventFromSystem("Changement d'arrangement", EventType.ACTION, INVOICE_PLAN,
                invoicingPlan.getId(), null);

        repository.save(invoicingPlan);
    }

    public void switchInvoiceSendingMethod(UUID idInvoicingPlan, InvoiceSendingMethod invoiceSendingMethod) {
        InvoicingPlan invoicingPlan = repository.findById(idInvoicingPlan).orElseThrow();

        if (invoicingPlan.getState() != State.DRAFT && invoicingPlan.getState() != State.ISOLATED) {
            throw new IllegalStateException("Invoicing plan must be in state Draft or Isolated to split invoices");
        }

        if (invoicingPlan.getInvoiceSendingMethod() == InvoiceSendingMethod.EMAIL &&
                invoiceSendingMethod == InvoiceSendingMethod.POSTAL) {
            invoicingPlan.setInvoiceSendingMethod(invoiceSendingMethod);
            manageInvoiceSendingMethod(invoicingPlan);
            this.eventLogService.eventFromSystem(
                    "Facture à envoyer par la poste pour " + invoicingPlan.getBillingNumber(), EventType.ACTION,
                    PARTICIPATION, invoicingPlan.getParticipation().getId(), null);
            this.eventLogService.eventFromSystem("Facture à envoyer par la poste", EventType.ACTION, INVOICE_PLAN,
                    invoicingPlan.getId(), null);
        } else if (invoicingPlan.getInvoiceSendingMethod() == InvoiceSendingMethod.POSTAL &&
                invoiceSendingMethod == InvoiceSendingMethod.EMAIL) {
            invoicingPlan.setInvoiceSendingMethod(invoiceSendingMethod);
            manageInvoiceSendingMethod(invoicingPlan);
            this.eventLogService.eventFromSystem("Facture à envoyer par émail pour " + invoicingPlan.getBillingNumber(),
                    EventType.ACTION, PARTICIPATION, invoicingPlan.getParticipation().getId(), null);
            this.eventLogService.eventFromSystem("Facture à envoyer par émail", EventType.ACTION, INVOICE_PLAN,
                    invoicingPlan.getId(), null);
        }

        repository.save(invoicingPlan);
    }

    public void manageInvoiceSendingMethod(InvoicingPlan plan) {
        if (plan.getInvoiceSendingMethod() == InvoiceSendingMethod.POSTAL && !plan.getInvoices().stream().anyMatch(invoice -> invoice.getType() == POSTAL_FEE)) {
            Invoice postalFee = new Invoice();
            postalFee.setPosition((long) plan.getInvoices().size() + 1);
            postalFee.setReferenceId(null);
            postalFee.setLock(false);
            postalFee.setGenerationDate(Instant.now());
            postalFee.setType(POSTAL_FEE);
            postalFee.setLabel(sub(messageSource.getMessage("invoice.sending-postal.label", null, Locale.FRENCH)));
            postalFee.setQuantity(1L);
            postalFee.setDefaultAmount(3.00);
            postalFee.setCustomAmount(3.00);

            plan.addInvoice(postalFee);
        } else if(plan.getInvoiceSendingMethod() == InvoiceSendingMethod.EMAIL) {
            plan.getInvoices().removeIf((invoice -> invoice.getType() == POSTAL_FEE));
        }
    }

    public void splitInvoicingPlan(UUID idInvoicingPlan, List<UUID> invoicesIds, boolean forceWithArrangment,
            boolean forceWithEmailMethod) {
        InvoicingPlan invoicingPlan = repository.findById(idInvoicingPlan).orElseThrow();

        if (!invoicingPlan.getState().isDraft()) {
            throw new IllegalStateException("Invoicing plan must be in state Draft or Isolated to split invoices");
        }

        final InvoicingPlan lastPlan =
                repository.findByParticipationIdOrderByBillingNumberDesc(invoicingPlan.getParticipation().getId())
                          .stream().max(Comparator.comparing(InvoicingPlan::getBillingNumber)).orElse(null);

        Participation participation =
                participationRepository.findById(invoicingPlan.getParticipation().getId()).orElseThrow();
        if (participation.getStatus() == Status.CLOSED) {
            return;
        }

        InvoicingPlan currentInvoicingPlan = new InvoicingPlan();
        currentInvoicingPlan.setParticipation(participation);
        currentInvoicingPlan.setNeedArrangement(forceWithArrangment || participation.getNeedArrangement());
        currentInvoicingPlan.setState(State.ISOLATED);
        currentInvoicingPlan.setInvoiceSendingMethod(
                forceWithEmailMethod ? InvoiceSendingMethod.EMAIL : participation.getInvoiceSendingMethod());
        currentInvoicingPlan.setBillingNumber(lastPlan != null ? incrementBillingNumber(lastPlan.getBillingNumber()) :
                participation.getClientNumber() + "-" + "001");
        currentInvoicingPlan.setGenerationDate(Instant.now());

        // Récupérer les factures à déplacer
        Set<Invoice> invoicesToMove =
                invoicingPlan.getInvoices().stream().filter(invoice -> invoicesIds.contains(invoice.getId()))
                             .collect(Collectors.toSet());

        if (invoicesToMove.isEmpty()) {
            throw new IllegalStateException("No invoices found to move.");
        }

        // Supprimer les factures du sourcePlan
        invoicingPlan.getInvoices().removeAll(invoicesToMove);

        // Ajouter les factures au targetPlan
        currentInvoicingPlan.getInvoices().addAll(invoicesToMove);

        // Sauvegarder les modifications
        if (invoicingPlan.getInvoices().isEmpty()) {
            repository.delete(invoicingPlan);
        } else {
            repository.save(invoicingPlan);
        }
        repository.save(currentInvoicingPlan);
    }

    public void refreshInvoicingPlans(String idParticipation) {
        if (StringUtils.isBlank(idParticipation)) {
            throw new IllegalStateException("No idParticipation given");
        }

        UUID participationId = UUID.fromString(idParticipation);
        Participation participation = participationRepository.findById(participationId).orElseThrow();

        if (participation.getStatus() == Status.CLOSED) {
            return;
        }

        Salon salon = salonRepository.findById(participation.getSalon().getId()).orElseThrow();

        List<Stand> stands = standRepository.findByParticipationIdOrderByRegistrationDateDesc(participationId);
        List<Conference> conferences =
                conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(participationId);
        List<Workshop> workshops = workshopRepository.findByParticipationIdOrderByRegistrationDateDesc(participationId);

        // On ne garde que les entités "actives"
        List<Stand> validStands = stands.stream().filter(stand -> !stand.getStatus().isInvalidStatus()).toList();
        List<Conference> validConferences =
                conferences.stream().filter(conf -> !conf.getStatus().isInvalidStatus()).toList();
        List<Workshop> validWorkshops = workshops.stream().filter(ws -> !ws.getStatus().isInvalidStatus()).toList();

        // Tous les plans de la participation, sauf CANCELLED
        List<InvoicingPlan> activePlans =
                repository.findByParticipationIdOrderByBillingNumberAsc(participationId).stream()
                          .filter(plan -> plan.getState() != State.CANCELLED).toList();

        InvoicingPlan lastPlan =
                activePlans.stream().max(Comparator.comparing(InvoicingPlan::getBillingNumber)).orElse(null);
        InvoicingPlan lastDraftPlan =
                repository.findFirstByParticipationIdAndStateOrderByBillingNumberDesc(participationId, State.DRAFT);

        InvoiceCoverage coverage =
                computeInvoiceCoverage(participation, salon, validStands, validConferences, validWorkshops,
                        activePlans);

        // Si tous les éléments attendus sont présents et que les montants
        // correspondent déjà aux prix du salon -> rien à faire
        if (coverage.isAllElementsPresent() && coverage.getDifferences().isEmpty()) {
            return;
        }

        // Initialisation comme avant
        InvoicingPlan currentInvoicingPlan;

        if (lastPlan == null) {
            currentInvoicingPlan = createNewDraftPlan(participation, participation.getClientNumber() + "-001");
            currentInvoicingPlan.setGenerationDate(Instant.now());
            currentInvoicingPlan.setNeedArrangement(participation.getNeedArrangement());
            currentInvoicingPlan.setInvoiceSendingMethod(participation.getInvoiceSendingMethod());
        } else if (lastDraftPlan != null) {
            currentInvoicingPlan = lastDraftPlan;
            currentInvoicingPlan.setInvoiceSendingMethod(participation.getInvoiceSendingMethod());
            currentInvoicingPlan.setNeedArrangement(participation.getNeedArrangement());
        } else {
            currentInvoicingPlan =
                    createNewDraftPlan(participation, incrementBillingNumber(lastPlan.getBillingNumber()));
            currentInvoicingPlan.setGenerationDate(Instant.now());
            currentInvoicingPlan.setNeedArrangement(participation.getNeedArrangement());
            currentInvoicingPlan.setInvoiceSendingMethod(participation.getInvoiceSendingMethod());
        }

        long position = currentInvoicingPlan.getInvoices().stream()
                                            .mapToLong(inv -> inv.getPosition() != null ? inv.getPosition() : 0L).max()
                                            .orElse(0L);

        final double EPSILON_TOTAL = 0.01;

        for (InvoiceDiff diff : coverage.getDifferences()) {
            double deltaTotal = diff.getDelta();
            long deltaQuantity = diff.getDeltaQuantity();

            if (Math.abs(deltaTotal) < EPSILON_TOTAL && deltaQuantity == 0L) {
                continue;
            }

            InvoiceExpected expected = diff.getExpected();

            // --- CAS SPÉCIAL STAND : changement de prix uniquement ---
            if (expected.getType() == STAND && deltaQuantity == 0L &&
                    Math.abs(diff.getExistingTotal()) > EPSILON_TOTAL) {

                // 1) Ligne d'annulation de l'ancien stand
                position += 1;

                Invoice cancel = new Invoice();
                cancel.setPosition(position);
                cancel.setReferenceId(expected.getReferenceId());
                cancel.setLock(false);
                cancel.setGenerationDate(Instant.now());
                cancel.setType(STAND);

                String baseLabel = diff.getExistingLabel() != null ? diff.getExistingLabel() : expected.getLabel();
                cancel.setLabel(sub("Annulation : " + baseLabel));

                cancel.setQuantity(1L);
                double existingTotal = diff.getExistingTotal();
                cancel.setDefaultAmount(-existingTotal);
                cancel.setCustomAmount(-existingTotal);

                currentInvoicingPlan.addInvoice(cancel);

                // 2) Nouvelle ligne de stand avec le nouveau prix (prix salon / dimension actuelle)
                position += 1;

                Invoice newStand = new Invoice();
                newStand.setPosition(position);
                newStand.setReferenceId(expected.getReferenceId());
                newStand.setLock(false);
                newStand.setGenerationDate(Instant.now());
                newStand.setType(STAND);
                newStand.setLabel(sub(expected.getLabel()));
                newStand.setQuantity(expected.getQuantity());
                newStand.setDefaultAmount(expected.getUnitPrice());
                newStand.setCustomAmount(expected.getUnitPrice());

                currentInvoicingPlan.addInvoice(newStand);

                // on a géré le cas STAND, on passe au diff suivant
                continue;
            }

            // --- CAS GÉNÉRIQUE (comme avant) ---
            position += 1;

            Invoice invoice = new Invoice();
            invoice.setPosition(position);
            invoice.setReferenceId(expected.getReferenceId());
            invoice.setLock(false);
            invoice.setGenerationDate(Instant.now());
            invoice.setType(expected.getType());
            invoice.setLabel(sub(expected.getLabel()));

            if (deltaQuantity != 0L) {
                // Ajustement par quantité : quantité = |deltaQuantity|, montant unitaire = +/- prix salon
                long qty = Math.abs(deltaQuantity);
                double unitAmount = expected.getUnitPrice();
                if (deltaQuantity < 0) {
                    unitAmount = -unitAmount;
                }
                invoice.setQuantity(qty);
                invoice.setDefaultAmount(unitAmount);
                invoice.setCustomAmount(unitAmount);
            } else {
                // Pas de différence de quantité, seulement de prix -> on ajuste uniquement le total
                invoice.setQuantity(1L);
                invoice.setDefaultAmount(deltaTotal);
                invoice.setCustomAmount(deltaTotal);
            }

            currentInvoicingPlan.addInvoice(invoice);
        }

        currentInvoicingPlan = repository.save(currentInvoicingPlan);

        // Séparation des repas si nécessaire (les ajouts de type MEAL1/2/3 seront aussi séparés)
        if (participation.getModePaymentMeals() == ModePaymentMeals.SEPARATE) {
            List<Invoice> meals = currentInvoicingPlan.getInvoices().stream()
                                                      .filter(invoice -> invoice.getType() == MEAL1 ||
                                                              invoice.getType() == MEAL2 || invoice.getType() == MEAL3)
                                                      .toList();

            if (!meals.isEmpty()) {
                splitInvoicingPlan(currentInvoicingPlan.getId(), meals.stream().map(Invoice::getId).toList(), true,
                        true);
            }
        }

        if (currentInvoicingPlan.getInvoices().isEmpty()) {
            repository.delete(currentInvoicingPlan);
        } else {
            manageInvoiceSendingMethod(currentInvoicingPlan);
            repository.save(currentInvoicingPlan);
        }
    }

    private InvoiceCoverage computeInvoiceCoverage(Participation participation, Salon salon, List<Stand> validStands,
            List<Conference> validConferences, List<Workshop> validWorkshops, List<InvoicingPlan> activePlans) {
        // 1) Construire la map des éléments attendus
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

        // MEALS (refId = null) – toujours présents dans expectedMap, même avec quantité 0
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

        // 1.bis) Nettoyer les brouillons des lignes obsolètes
        cleanDraftInvoicesNotInExpected(expectedMap, activePlans);

        // 1.ter) Forcer l'unicité STAND / CONFERENCE / WORKSHOP
        enforceUniqueStandConferenceWorkshopInvoices(activePlans);

        // 2) Totaux, quantités et labels déjà facturés (tous plans non CANCELLED, après nettoyage)
        var existingTotals = new java.util.HashMap<InvoiceKey, Double>();
        var existingQuantities = new java.util.HashMap<InvoiceKey, Long>();
        var existingLabels = new java.util.HashMap<InvoiceKey, String>();

        for (InvoicingPlan plan : activePlans) {
            for (Invoice inv : plan.getInvoices()) {
                InvoiceKey key = new InvoiceKey(inv.getType(), inv.getReferenceId());
                double total = inv.getTotalAmount();

                existingTotals.merge(key, total, Double::sum);

                long qty = inv.getQuantity() != null ? inv.getQuantity() : 1L;

                if (isQuantityRelevant(inv.getType())) {
                    // Pour MEAL1/2/3 : quantité "signée" selon le total
                    if (total < 0.0) {
                        qty = -qty;
                    }
                }

                existingQuantities.merge(key, qty, Long::sum);

                existingLabels.put(key, inv.getLabel());
            }
        }

        // 3) Comparaison montants + quantités
        boolean allElementsPresent = true;
        List<InvoiceDiff> diffs = new java.util.ArrayList<>();
        final double EPSILON_TOTAL = 0.01;

        for (InvoiceExpected expected : expectedMap.values()) {
            InvoiceKey key = new InvoiceKey(expected.getType(), expected.getReferenceId());

            double existingTotal = existingTotals.getOrDefault(key, 0.0);
            long existingQty = existingQuantities.getOrDefault(key, 0L);
            String existingLabel = existingLabels.get(key);

            long expectedQty = expected.getQuantity();
            double expectedTotal = expected.getExpectedTotal();

            boolean quantityRelevant = isQuantityRelevant(expected.getType());

            // Présence : on considère que l'élément est "facturé" s'il y a un total non nul
            if (Math.abs(existingTotal) < EPSILON_TOTAL) {
                allElementsPresent = false;
            }

            double deltaTotal = expectedTotal - existingTotal;
            long deltaQty = quantityRelevant ? (expectedQty - existingQty) : 0L;

            // On ne déclenche une diff sur la quantité QUE si elle est pertinente (repas)
            if (Math.abs(deltaTotal) > EPSILON_TOTAL || (quantityRelevant && deltaQty != 0L)) {
                diffs.add(new InvoiceDiff(expected, existingTotal, existingQty, deltaTotal, deltaQty, existingLabel));
            }
        }

        return new InvoiceCoverage(allElementsPresent, diffs);
    }

    private void cleanDraftInvoicesNotInExpected(java.util.Map<InvoiceKey, InvoiceExpected> expectedMap,
            List<InvoicingPlan> activePlans) {
        Set<InvoiceKey> expectedKeys = expectedMap.keySet();

        for (InvoicingPlan plan : activePlans) {
            // On ne touche qu'aux brouillons (DRAFT + ISOLATED)
            if (!plan.getState().isDraft()) {
                continue;
            }

            boolean modified = plan.getInvoices().removeIf(inv -> {
                if (!isManagedInvoiceType(inv.getType())) {
                    // on ne supprime pas les types "custom" non gérés par la génération auto
                    return false;
                }
                InvoiceKey key = new InvoiceKey(inv.getType(), inv.getReferenceId());
                // si la clé n'est plus attendue -> on supprime
                return !expectedKeys.contains(key);
            });

            if (modified) {
                repository.save(plan);
            }
        }
    }

    private boolean isQuantityRelevant(Type type) {
        // On considère que la quantité est métier uniquement pour les repas
        return type == MEAL1 || type == MEAL2 || type == MEAL3;
    }

    private void enforceUniqueStandConferenceWorkshopInvoices(List<InvoicingPlan> activePlans) {
        // Regrouper toutes les invoices STAND / CONFERENCE / WORKSHOP par (type, referenceId)
        class InvoiceLocation {
            final InvoicingPlan plan;
            final Invoice invoice;

            InvoiceLocation(InvoicingPlan plan, Invoice invoice) {
                this.plan = plan;
                this.invoice = invoice;
            }
        }

        var grouped = new java.util.HashMap<InvoiceKey, List<InvoiceLocation>>();

        for (InvoicingPlan plan : activePlans) {
            for (Invoice inv : plan.getInvoices()) {
                Type type = inv.getType();
                if (type != STAND && type != CONFERENCE && type != WORKSHOP) {
                    continue;
                }
                InvoiceKey key = new InvoiceKey(type, inv.getReferenceId());
                grouped.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add(new InvoiceLocation(plan, inv));
            }
        }

        java.util.Set<InvoicingPlan> modifiedPlans = new java.util.HashSet<>();

        for (var entry : grouped.entrySet()) {
            List<InvoiceLocation> locations = entry.getValue();
            if (locations.isEmpty()) {
                continue;
            }

            boolean hasNonDraft = locations.stream().anyMatch(loc -> !loc.plan.getState().isDraft());

            if (hasNonDraft) {
                // On supprime uniquement les duplicates dans les brouillons
                for (InvoiceLocation loc : locations) {
                    if (loc.plan.getState().isDraft()) {
                        loc.plan.getInvoices().remove(loc.invoice);
                        modifiedPlans.add(loc.plan);
                    }
                }
            } else {
                // Uniquement des brouillons -> on supprime tout
                for (InvoiceLocation loc : locations) {
                    loc.plan.getInvoices().remove(loc.invoice);
                    modifiedPlans.add(loc.plan);
                }
                // La diff va recréer la/les lignes correctes dans le brouillon courant
            }
        }

        for (InvoicingPlan plan : modifiedPlans) {
            repository.save(plan);
        }
    }

    private boolean isManagedInvoiceType(Type type) {
        return type == STAND || type == SHARED || type == CONFERENCE || type == WORKSHOP || type == MEAL1 ||
                type == MEAL2 || type == MEAL3 || type == POSTAL_FEE;
    }

    private InvoicingPlan createNewDraftPlan(Participation participation, String billingNumber) {
        InvoicingPlan plan = new InvoicingPlan();
        plan.setState(State.DRAFT);
        plan.setParticipation(participation);
        plan.setBillingNumber(billingNumber);
        return plan;
    }

    private void updateOrCreateInvoice(Set<Invoice> lockedInvoices, UUID referenceId, Type type, String description,
            Long quantity, Double defaultAmount, Long position) {
        Invoice lockedInvoice = lockedInvoices.stream().filter(invoice -> invoice.getType() == type &&
                invoice.getReferenceId().equals(referenceId)).findFirst().orElse(null);

        if (lockedInvoice != null) {
            lockedInvoice.setPosition(position);
            lockedInvoice.setDefaultAmount(defaultAmount);
        } else {
            lockedInvoices.add(createInvoice(referenceId, type, description, quantity, defaultAmount, position));
        }
    }

    private Invoice createInvoice(UUID referenceId, Type type, String label, Long quantity, Double defaultAmount,
            Long position) {
        defaultAmount = defaultAmount != null ? defaultAmount : 0;

        Invoice invoice = new Invoice();
        invoice.setPosition(position);
        invoice.setReferenceId(referenceId);
        invoice.setLock(false);
        invoice.setGenerationDate(Instant.now());
        invoice.setType(type);
        invoice.setLabel(sub(label));
        invoice.setQuantity(quantity);
        invoice.setDefaultAmount(defaultAmount);
        invoice.setCustomAmount(defaultAmount);

        return invoice;
    }

    private String incrementBillingNumber(String billingNumber) {
        // Séparer les deux parties
        String[] parts = billingNumber.split("-");
        String prefix1 = parts[0];
        String prefix2 = parts[1];
        String numberPart = parts[2];

        // Convertir la partie numérique après le tiret en entier
        int number = Integer.parseInt(numberPart);

        // Incrémenter le nombre
        number++;

        // Reformater le numéro incrémenté avec le même nombre de chiffres
        String newNumberPart = String.format("%03d", number);

        // Assembler le nouveau numéro
        return prefix1 + "-" + prefix2 + "-" + newNumberPart;
    }

    private String sub(String chaine) {
        return chaine != null ? chaine.substring(0, Math.min(40, chaine.length())) : null;
    }
}
