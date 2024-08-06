package ch.salon.service;

import ch.salon.domain.*;
import ch.salon.domain.enumeration.Type;
import ch.salon.repository.*;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.time.Instant;
import java.util.*;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class InvoicingPlanService {

    public static final String ENTITY_NAME = "invoicingPlan";

    private final SalonRepository salonRepository;
    private final ParticipationRepository participationRepository;
    private final InvoicingPlanRepository invoicingPlanRepository;
    private final StandRepository standRepository;
    private final ConferenceRepository conferenceRepository;

    public InvoicingPlanService(
        SalonRepository salonRepository,
        ParticipationRepository participationRepository,
        InvoicingPlanRepository invoicingPlanRepository,
        StandRepository standRepository,
        ConferenceRepository conferenceRepository
    ) {
        this.participationRepository = participationRepository;
        this.salonRepository = salonRepository;
        this.invoicingPlanRepository = invoicingPlanRepository;
        this.standRepository = standRepository;
        this.conferenceRepository = conferenceRepository;
    }

    public UUID create(InvoicingPlan invoicingPlan) {
        if (invoicingPlan.getId() != null) {
            throw new BadRequestAlertException("A new invoicingPlan cannot already have an ID", ENTITY_NAME, "idexists");
        }

        return invoicingPlanRepository.save(invoicingPlan).getId();
    }

    public InvoicingPlan update(final UUID id, InvoicingPlan invoicingPlan) {
        if (invoicingPlan.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, invoicingPlan.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!invoicingPlanRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        return invoicingPlanRepository.save(invoicingPlan);
    }

    public List<InvoicingPlan> findAll(String idParticipation) {
        if (StringUtils.isNotBlank(idParticipation)) {
            List<InvoicingPlan> invoicingPlans = invoicingPlanRepository.findByParticipationId(UUID.fromString(idParticipation));
            invoicingPlans.sort(Comparator.comparing(InvoicingPlan::getBillingNumber));
            return invoicingPlans;
        }

        throw new IllegalStateException("No filter given");
    }

    public Optional<InvoicingPlan> get(UUID id) {
        return invoicingPlanRepository.findById(id);
    }

    public void delete(UUID id) {
        invoicingPlanRepository.deleteById(id);
    }

    public void generateInvoicingPlan(String idParticipation) {
        if (StringUtils.isBlank(idParticipation)) {
            throw new IllegalStateException("No idParticipation given");
        }

        Participation participation = participationRepository.findById(UUID.fromString(idParticipation)).orElseThrow();

        if (participation.getIsBillingClosed()) {
            return;
        }

        List<InvoicingPlan> invoicings = invoicingPlanRepository.findByParticipationId(participation.getId());

        final InvoicingPlan invoicingPlanToCreate = new InvoicingPlan();
        if (invoicings != null && !invoicings.isEmpty()) {
            InvoicingPlan lastPlan = invoicings
                .stream()
                .max(Comparator.comparingInt(invoicing -> Integer.parseInt(invoicing.getBillingNumber())))
                .orElseThrow();
            invoicingPlanToCreate.setBillingNumber(incrementBillingNumber(lastPlan.getBillingNumber()));
        } else {
            invoicingPlanToCreate.setBillingNumber(participation.getClientNumber() + "-" + "001");
        }

        invoicingPlanToCreate.setParticipation(participation);
        invoicingPlanToCreate.setInvoices(new HashSet<>());
        invoicingPlanToCreate.setGenerationDate(Instant.now());
        invoicingPlanToCreate.setHasBeenSent(false);

        Salon salon = salonRepository.findById(participation.getSalon().getId()).orElseThrow();

        standRepository
            .findByParticipationId(participation.getId())
            .forEach(stand -> {
                if (stand.getDimension() != null) {
                    Double priceStandSalon = salon
                        .getPriceStandSalons()
                        .stream()
                        .filter(priceStand -> priceStand.getDimension().getId().equals(stand.getDimension().getId()))
                        .findFirst()
                        .map(PriceStandSalon::getPrice)
                        .orElse((double) 0);

                    createInvoice(
                        invoicingPlanToCreate,
                        stand.getId(),
                        Type.STAND,
                        stand.getDimension().getDimension(),
                        1L,
                        priceStandSalon
                    );
                }

                if (stand.getShared()) {
                    createInvoice(
                        invoicingPlanToCreate,
                        stand.getId(),
                        Type.SHARED,
                        stand.getDimension().getDimension(),
                        1L,
                        salon.getPriceSharingStand() != null ? salon.getPriceSharingStand() : 0
                    );
                }
            });

        conferenceRepository
            .findByParticipationId(participation.getId())
            .forEach(conference -> {
                createInvoice(
                    invoicingPlanToCreate,
                    conference.getId(),
                    Type.CONFERENCE,
                    conference.getTitle(),
                    1L,
                    salon.getPriceConference() != null ? salon.getPriceConference() : 0
                );
            });

        Long meal1 = participation.getNbMeal1();
        if (meal1 != null && meal1 > 0) {
            createInvoice(
                invoicingPlanToCreate,
                null,
                Type.MEAL,
                "Samedi midi",
                meal1,
                salon.getPriceMeal1() != null ? salon.getPriceMeal1() : 0
            );
        }

        Long meal2 = participation.getNbMeal2();
        if (meal2 != null && meal2 > 0) {
            createInvoice(
                invoicingPlanToCreate,
                null,
                Type.MEAL,
                "Samedi soir",
                meal2,
                salon.getPriceMeal2() != null ? salon.getPriceMeal2() : 0
            );
        }

        Long meal3 = participation.getNbMeal3();
        if (meal3 != null && meal3 > 0) {
            createInvoice(
                invoicingPlanToCreate,
                null,
                Type.MEAL,
                "Samedi soir",
                meal3,
                salon.getPriceMeal3() != null ? salon.getPriceMeal3() : 0
            );
        }

        invoicingPlanRepository.save(invoicingPlanToCreate);
    }

    private void createInvoice(
        InvoicingPlan invoicingPlan,
        UUID referenceId,
        Type type,
        String label,
        Long quantity,
        Double defaultAmount
    ) {
        Invoice invoice = new Invoice();
        invoice.setReferenceId(referenceId);
        invoice.setLock(false);
        invoice.setGenerationDate(Instant.now());
        invoice.setType(type);
        invoice.setLabel(sub(label));
        invoice.setQuantity(quantity);
        invoice.setDefaultAmount(defaultAmount);
        invoice.setCustomAmount(defaultAmount);
        invoice.setTotal(defaultAmount * quantity);
        invoicingPlan.addInvoice(invoice);
    }

    private String incrementBillingNumber(String billingNumber) {
        // Séparer les deux parties
        String[] parts = billingNumber.split("-");
        String prefix = parts[0];
        String numberPart = parts[1];

        // Convertir la partie numérique après le tiret en entier
        int number = Integer.parseInt(numberPart);

        // Incrémenter le nombre
        number++;

        // Reformater le numéro incrémenté avec le même nombre de chiffres
        String newNumberPart = String.format("%03d", number);

        // Assembler le nouveau numéro
        return prefix + "-" + newNumberPart;
    }

    private String sub(String chaine) {
        return chaine != null ? chaine.substring(0, Math.min(30, chaine.length())) : null;
    }
}
