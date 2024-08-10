package ch.salon.service;

import ch.salon.domain.Conference;
import ch.salon.domain.Exponent;
import ch.salon.domain.Invoice;
import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.Participation;
import ch.salon.domain.PriceStandSalon;
import ch.salon.domain.Salon;
import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.Type;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.StandRepository;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

@Service
public class InvoicingPlanService {

    public static final String ENTITY_NAME = "invoicingPlan";

    private final SalonRepository salonRepository;
    private final ParticipationRepository participationRepository;
    private final InvoicingPlanRepository invoicingPlanRepository;
    private final StandRepository standRepository;
    private final ConferenceRepository conferenceRepository;
    private final MessageSource messageSource;
    private final MailService mailService;

    public InvoicingPlanService(
        SalonRepository salonRepository,
        ParticipationRepository participationRepository,
        InvoicingPlanRepository invoicingPlanRepository,
        StandRepository standRepository,
        ConferenceRepository conferenceRepository,
        MessageSource messageSource,
        MailService mailService
    ) {
        this.participationRepository = participationRepository;
        this.salonRepository = salonRepository;
        this.invoicingPlanRepository = invoicingPlanRepository;
        this.standRepository = standRepository;
        this.conferenceRepository = conferenceRepository;
        this.messageSource = messageSource;
        this.mailService = mailService;
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

    public void send(UUID idInvoicingPlan) {
        if (idInvoicingPlan == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = invoicingPlanRepository
            .findById(idInvoicingPlan)
            .orElseThrow(() -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        Salon salon = invoicingPlan.getParticipation().getSalon();
        Exponent exponent = invoicingPlan.getParticipation().getExponent();

        mailService.sendInvoiceMail(salon, exponent, invoicingPlan);

        invoicingPlan.setHasBeenSent(true);
        invoicingPlanRepository.save(invoicingPlan);
    }

    public void switchLock(UUID idInvoicingPlan, UUID idInvoice) {
        if (idInvoicingPlan == null || idInvoice == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = invoicingPlanRepository
            .findById(idInvoicingPlan)
            .orElseThrow(() -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        Invoice invoiceFound = invoicingPlan
            .getInvoices()
            .stream()
            .filter(invoice -> invoice.getId().equals(idInvoice))
            .findFirst()
            .orElseThrow();
        invoiceFound.setLock(!invoiceFound.getLock());
        invoicingPlanRepository.save(invoicingPlan);
    }

    public List<InvoicingPlan> findAll(String idParticipation) {
        if (StringUtils.isNotBlank(idParticipation)) {
            List<InvoicingPlan> invoicingPlans = invoicingPlanRepository.findByParticipationId(UUID.fromString(idParticipation));
            invoicingPlans.sort(Comparator.comparing(InvoicingPlan::getBillingNumber).reversed());
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

        final InvoicingPlan lastPlan = invoicingPlanRepository
            .findByParticipationId(participation.getId())
            .stream()
            .max(Comparator.comparing(InvoicingPlan::getBillingNumber))
            .orElse(null);

        InvoicingPlan currentInvoicingPlan;
        Set<Invoice> lockedInvoices = new HashSet<>();

        if (lastPlan == null) {
            currentInvoicingPlan = new InvoicingPlan();
            currentInvoicingPlan.setParticipation(participation);
            currentInvoicingPlan.setBillingNumber(participation.getClientNumber() + "-" + "001");
        } else if (lastPlan.isHasBeenSent()) {
            currentInvoicingPlan = new InvoicingPlan();
            currentInvoicingPlan.setParticipation(participation);
            currentInvoicingPlan.setBillingNumber(incrementBillingNumber(lastPlan.getBillingNumber()));
            copyLockedInvoices(lastPlan, lockedInvoices);
        } else {
            currentInvoicingPlan = lastPlan;
            copyLockedInvoices(lastPlan, lockedInvoices);
        }

        currentInvoicingPlan.setGenerationDate(Instant.now());

        Salon salon = salonRepository.findById(participation.getSalon().getId()).orElseThrow();

        List<Stand> stands = standRepository.findByParticipationId(participation.getId());
        removeObsoleteStandInvoices(lockedInvoices, stands);
        stands.forEach(stand -> processStand(stand, salon, lockedInvoices));

        List<Conference> conferences = conferenceRepository.findByParticipationId(participation.getId());
        removeObsoleteConferenceInvoices(lockedInvoices, conferences);
        conferences.forEach(conference -> processConference(conference, salon, lockedInvoices));

        processMeals(participation, salon, lockedInvoices);

        currentInvoicingPlan.getInvoices().clear();
        lockedInvoices.forEach(currentInvoicingPlan::addInvoice);

        invoicingPlanRepository.save(currentInvoicingPlan);
    }

    private void copyLockedInvoices(InvoicingPlan plan, Set<Invoice> lockedInvoices) {
        plan
            .getInvoices()
            .forEach(invoice -> {
                if (invoice.getLock()) {
                    lockedInvoices.add(new Invoice(invoice));
                }
            });
    }

    private void removeObsoleteStandInvoices(Set<Invoice> lockedInvoices, List<Stand> stands) {
        lockedInvoices.removeIf(
            invoice ->
                (invoice.getType() == Type.STAND || invoice.getType() == Type.SHARED) &&
                stands.stream().map(Stand::getId).noneMatch(id -> id.equals(invoice.getReferenceId()))
        );
    }

    private void processStand(Stand stand, Salon salon, Set<Invoice> lockedInvoices) {
        Double defaultPrice = stand.getDimension() == null
            ? 0
            : salon
                .getPriceStandSalons()
                .stream()
                .filter(priceStand -> priceStand.getDimension().getId().equals(stand.getDimension().getId()))
                .findFirst()
                .map(PriceStandSalon::getPrice)
                .orElse(0.0);

        updateOrCreateInvoice(
            lockedInvoices,
            stand.getId(),
            Type.STAND,
            stand.getDimension() != null ? stand.getDimension().getDimension() : "unknown dimension",
            1L,
            defaultPrice
        );

        if (stand.getShared()) {
            updateOrCreateInvoice(
                lockedInvoices,
                stand.getId(),
                Type.SHARED,
                stand.getDimension() != null ? stand.getDimension().getDimension() : "unknown dimension",
                1L,
                salon.getPriceSharingStand()
            );
        }
    }

    private void removeObsoleteConferenceInvoices(Set<Invoice> lockedInvoices, List<Conference> conferences) {
        lockedInvoices.removeIf(
            invoice ->
                invoice.getType() == Type.CONFERENCE &&
                conferences.stream().map(Conference::getId).noneMatch(id -> id.equals(invoice.getReferenceId()))
        );
    }

    private void processConference(Conference conference, Salon salon, Set<Invoice> lockedInvoices) {
        updateOrCreateInvoice(lockedInvoices, conference.getId(), Type.CONFERENCE, conference.getTitle(), 1L, salon.getPriceConference());
    }

    private void processMeals(Participation participation, Salon salon, Set<Invoice> lockedInvoices) {
        processMeal(
            Type.MEAL1,
            participation.getNbMeal1(),
            messageSource.getMessage("saturday.midday", null, Locale.FRENCH),
            salon.getPriceMeal1(),
            lockedInvoices
        );
        processMeal(
            Type.MEAL2,
            participation.getNbMeal2(),
            messageSource.getMessage("saturday.evening", null, Locale.FRENCH),
            salon.getPriceMeal2(),
            lockedInvoices
        );
        processMeal(
            Type.MEAL3,
            participation.getNbMeal3(),
            messageSource.getMessage("sunday.midday", null, Locale.FRENCH),
            salon.getPriceMeal3(),
            lockedInvoices
        );
    }

    private void processMeal(Type type, Long mealCount, String description, Double price, Set<Invoice> lockedInvoices) {
        if (mealCount != null && mealCount > 0) {
            Invoice invoiceMealLocked = lockedInvoices
                .stream()
                .filter(invoice -> invoice.getType() == type && invoice.getLock())
                .findFirst()
                .orElse(null);
            if (invoiceMealLocked != null) {
                invoiceMealLocked.setDefaultAmount(price);
                invoiceMealLocked.setQuantity(mealCount);
                invoiceMealLocked.setTotal(invoiceMealLocked.getCustomAmount() * mealCount);
            } else {
                lockedInvoices.add(createInvoice(null, type, description, mealCount, price));
            }
        } else {
            lockedInvoices.removeIf(invoice -> invoice.getType() == type);
        }
    }

    private void updateOrCreateInvoice(
        Set<Invoice> lockedInvoices,
        UUID referenceId,
        Type type,
        String description,
        Long quantity,
        Double defaultAmount
    ) {
        Invoice lockedInvoice = lockedInvoices
            .stream()
            .filter(invoice -> invoice.getType() == type && invoice.getReferenceId().equals(referenceId))
            .findFirst()
            .orElse(null);
        if (lockedInvoice != null) {
            lockedInvoice.setDefaultAmount(defaultAmount);
        } else {
            lockedInvoices.add(createInvoice(referenceId, type, description, quantity, defaultAmount));
        }
    }

    private Invoice createInvoice(UUID referenceId, Type type, String label, Long quantity, Double defaultAmount) {
        defaultAmount = defaultAmount != null ? defaultAmount : 0;

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
        return chaine != null ? chaine.substring(0, Math.min(30, chaine.length())) : null;
    }
}
