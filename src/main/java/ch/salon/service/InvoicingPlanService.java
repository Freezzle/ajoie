package ch.salon.service;

import static ch.salon.domain.enumeration.Type.*;

import ch.salon.domain.Conference;
import ch.salon.domain.Invoice;
import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.Participation;
import ch.salon.domain.Payment;
import ch.salon.domain.PriceStandSalon;
import ch.salon.domain.Salon;
import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.domain.enumeration.Type;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.InvoiceRepository;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.PaymentRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.StandRepository;
import ch.salon.service.dto.InvoiceDTO;
import ch.salon.service.dto.InvoicingPlanDTO;
import ch.salon.service.dto.PaymentDTO;
import ch.salon.service.mail.InvoiceEmailCreator;
import ch.salon.service.mail.InvoiceReceiptEmailCreator;
import ch.salon.service.mapper.InvoiceMapper;
import ch.salon.service.mapper.InvoicingPlanMapper;
import ch.salon.service.mapper.PaymentMapper;
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
    private final EventLogService eventLogService;

    private final SalonRepository salonRepository;
    private final ParticipationRepository participationRepository;
    private final InvoicingPlanRepository invoicingPlanRepository;

    private final StandRepository standRepository;
    private final ConferenceRepository conferenceRepository;

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    private final MessageSource messageSource;
    private final InvoiceEmailCreator invoiceEmailCreator;
    private final InvoiceReceiptEmailCreator invoiceReceiptEmailCreator;

    public InvoicingPlanService(
        SalonRepository salonRepository,
        ParticipationRepository participationRepository,
        InvoicingPlanRepository invoicingPlanRepository,
        StandRepository standRepository,
        ConferenceRepository conferenceRepository,
        MessageSource messageSource,
        EventLogService eventLogService,
        PaymentRepository paymentRepository,
        InvoiceRepository invoiceRepository,
        InvoiceEmailCreator invoiceEmailCreator,
        InvoiceReceiptEmailCreator invoiceReceiptEmailCreator
    ) {
        this.participationRepository = participationRepository;
        this.salonRepository = salonRepository;
        this.invoicingPlanRepository = invoicingPlanRepository;
        this.standRepository = standRepository;
        this.conferenceRepository = conferenceRepository;
        this.messageSource = messageSource;
        this.eventLogService = eventLogService;
        this.paymentRepository = paymentRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceEmailCreator = invoiceEmailCreator;
        this.invoiceReceiptEmailCreator = invoiceReceiptEmailCreator;
    }

    public void sendInvoiceReceipt(UUID idInvoicingPlan) throws Exception {
        if (idInvoicingPlan == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = invoicingPlanRepository
            .findById(idInvoicingPlan)
            .orElseThrow(() -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        invoiceReceiptEmailCreator.fillInvoicingPlan(invoicingPlan);
        invoiceReceiptEmailCreator.sendEmailSync();

        eventLogService.eventFromSystem(
            "La quittance #" + invoicingPlan.getBillingNumber() + " a été envoyée.",
            EventType.EMAIL,
            EntityType.PARTICIPATION,
            invoicingPlan.getParticipation().getId()
        );
    }

    public void sendInvoice(UUID idInvoicingPlan) throws Exception {
        if (idInvoicingPlan == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = invoicingPlanRepository
            .findById(idInvoicingPlan)
            .orElseThrow(() -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        invoiceEmailCreator.fillInvoicingPlan(invoicingPlan);
        invoiceEmailCreator.sendEmailSync();

        eventLogService.eventFromSystem(
            "La facture #" + invoicingPlan.getBillingNumber() + " a été envoyée.",
            EventType.EMAIL,
            EntityType.PARTICIPATION,
            invoicingPlan.getParticipation().getId()
        );

        invoicingPlan.setState(State.CLOSED);
        invoicingPlanRepository.save(invoicingPlan);
    }

    public Optional<InvoiceDTO> createInvoice(UUID idInvoicingPlan, InvoiceDTO invoiceDTO) {
        if (idInvoicingPlan == null || invoiceDTO == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = invoicingPlanRepository
            .findById(idInvoicingPlan)
            .orElseThrow(() -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        Invoice invoiceToCreate = InvoiceMapper.INSTANCE.toEntity(invoiceDTO);
        invoiceToCreate.setDefaultAmount(invoiceDTO.getCustomAmount());
        invoiceToCreate = this.invoiceRepository.save(invoiceToCreate);

        invoicingPlan.addInvoice(invoiceToCreate);
        invoicingPlan = invoicingPlanRepository.save(invoicingPlan);

        this.eventLogService.eventFromSystem(
                "Une ligne de facture a été ajoutée dans la facture #" + invoicingPlan.getBillingNumber(),
                EventType.EVENT,
                EntityType.PARTICIPATION,
                invoicingPlan.getParticipation().getId()
            );

        return Optional.of(InvoiceMapper.INSTANCE.toDto(invoiceToCreate));
    }

    public Optional<InvoiceDTO> updateInvoice(UUID idInvoicingPlan, UUID idInvoice, InvoiceDTO invoiceDTO) {
        if (idInvoicingPlan == null || invoiceDTO == null) {
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

        if (!Objects.equals(invoiceFound.getCustomAmount(), invoiceDTO.getCustomAmount())) {
            this.eventLogService.eventFromSystem(
                    "Une ligne de facture a été changée dans la facture #" + invoicingPlan.getBillingNumber(),
                    EventType.EVENT,
                    EntityType.PARTICIPATION,
                    invoicingPlan.getParticipation().getId()
                );
        }

        invoiceFound.setLabel(invoiceDTO.getLabel());
        invoiceFound.setDefaultAmount(invoiceDTO.getDefaultAmount());
        invoiceFound.setCustomAmount(invoiceDTO.getCustomAmount());
        invoiceFound.setGenerationDate(Instant.now());
        invoiceFound.setExtraInformation(invoiceDTO.getExtraInformation());
        invoiceFound.setLock(invoiceDTO.getLock());

        invoicingPlanRepository.save(invoicingPlan);

        return Optional.of(InvoiceMapper.INSTANCE.toDto(invoiceFound));
    }

    public Optional<PaymentDTO> createPayment(UUID idInvoicingPlan, PaymentDTO paymentDTO) {
        if (paymentDTO.getId() != null) {
            throw new BadRequestAlertException("A new payment cannot already have an ID", ENTITY_NAME, "idexists");
        }
        if (paymentDTO.getAmount() >= 0.00) {
            paymentDTO.setAmount(paymentDTO.getAmount() * -1);
        }

        InvoicingPlan invoicingPlan = invoicingPlanRepository.getReferenceById(idInvoicingPlan);
        Payment payment = PaymentMapper.INSTANCE.toEntity(paymentDTO);
        payment = this.paymentRepository.save(payment);

        invoicingPlan.addPayment(payment);
        invoicingPlan = this.invoicingPlanRepository.save(invoicingPlan);

        this.eventLogService.eventFromSystem(
                "Un paiement a été ajouté dans la facture #" + invoicingPlan.getBillingNumber(),
                EventType.PAYMENT,
                EntityType.PARTICIPATION,
                invoicingPlan.getParticipation().getId()
            );

        return Optional.of(PaymentMapper.INSTANCE.toDto(payment));
    }

    public Optional<PaymentDTO> updatePayment(final UUID idInvoicingPlan, final UUID idPayment, PaymentDTO paymentDTO) {
        if (idPayment == null || paymentDTO == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = invoicingPlanRepository
            .findById(idInvoicingPlan)
            .orElseThrow(() -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        Payment paymentFound = invoicingPlan
            .getPayments()
            .stream()
            .filter(payment -> payment.getId().equals(idPayment))
            .findFirst()
            .orElseThrow();

        if (!Objects.equals(paymentDTO.getAmount(), paymentFound.getAmount())) {
            this.eventLogService.eventFromSystem(
                    "Un paiement a été changée dans la facture #" + invoicingPlan.getBillingNumber(),
                    EventType.EVENT,
                    EntityType.PARTICIPATION,
                    invoicingPlan.getParticipation().getId()
                );
        }

        paymentFound.setPaymentMode(paymentDTO.getPaymentMode());
        paymentFound.setBillingDate(paymentDTO.getBillingDate());
        paymentFound.setExtraInformation(paymentDTO.getExtraInformation());

        if (paymentDTO.getAmount() >= 0.00) {
            paymentFound.setAmount(paymentDTO.getAmount() * -1);
        } else {
            paymentFound.setAmount(paymentDTO.getAmount());
        }

        invoicingPlan = invoicingPlanRepository.save(invoicingPlan);

        return Optional.of(PaymentMapper.INSTANCE.toDto(paymentFound));
    }

    public void deletePayment(UUID idInvoicingPlan, UUID idPayment) {
        InvoicingPlan invoicingPlan = invoicingPlanRepository.getReferenceById(idInvoicingPlan);

        Payment paymentFound = invoicingPlan
            .getPayments()
            .stream()
            .filter(payment -> payment.getId().equals(idPayment))
            .findFirst()
            .orElseThrow();

        invoicingPlan.removePayment(paymentFound);

        this.invoicingPlanRepository.save(invoicingPlan);
        this.eventLogService.eventFromSystem(
                "Un paiement a été supprimé dans la facture #" + invoicingPlan.getBillingNumber(),
                EventType.PAYMENT,
                EntityType.PARTICIPATION,
                invoicingPlan.getParticipation().getId()
            );
    }

    public List<InvoicingPlanDTO> findAll(String idParticipation) {
        if (StringUtils.isNotBlank(idParticipation)) {
            List<InvoicingPlan> invoicingPlans = invoicingPlanRepository.findByParticipationIdOrderByBillingNumberDesc(
                UUID.fromString(idParticipation)
            );
            return invoicingPlans.stream().map(InvoicingPlanMapper.INSTANCE::toDto).toList();
        }

        throw new IllegalStateException("No filter given");
    }

    public void refreshInvoicingPlans(String idParticipation) {
        if (StringUtils.isBlank(idParticipation)) {
            throw new IllegalStateException("No idParticipation given");
        }

        Participation participation = participationRepository.findById(UUID.fromString(idParticipation)).orElseThrow();
        if (participation.getIsBillingClosed()) {
            return;
        }

        final InvoicingPlan lastPlan = invoicingPlanRepository
            .findByParticipationIdOrderByBillingNumberDesc(participation.getId())
            .stream()
            .max(Comparator.comparing(InvoicingPlan::getBillingNumber))
            .orElse(null);

        InvoicingPlan currentInvoicingPlan;
        Set<Invoice> lockedInvoices = new HashSet<>();
        Set<Payment> payments = new HashSet<>();

        if (lastPlan == null) {
            currentInvoicingPlan = new InvoicingPlan();
            currentInvoicingPlan.setParticipation(participation);
            currentInvoicingPlan.setBillingNumber(participation.getClientNumber() + "-" + "001");
        } else if (lastPlan.getState() == State.CLOSED) {
            currentInvoicingPlan = new InvoicingPlan();
            currentInvoicingPlan.setParticipation(participation);
            currentInvoicingPlan.setBillingNumber(incrementBillingNumber(lastPlan.getBillingNumber()));
            copyLockedInvoices(lastPlan, lockedInvoices);
            copyPayments(lastPlan, payments);
            currentInvoicingPlan.setPayments(payments);
        } else {
            currentInvoicingPlan = lastPlan;
            copyLockedInvoices(lastPlan, lockedInvoices);
        }

        currentInvoicingPlan.setGenerationDate(Instant.now());

        Salon salon = salonRepository.findById(participation.getSalon().getId()).orElseThrow();

        List<Stand> stands = standRepository.findByParticipationId(participation.getId());
        List<Conference> conferences = conferenceRepository.findByParticipationId(participation.getId());
        removeObsoleteStandInvoices(lockedInvoices, stands);
        removeObsoleteConferenceInvoices(lockedInvoices, conferences);

        Long position = 0L;
        for (Stand stand : stands.stream().filter(stand -> !stand.getStatus().isInvalidStatus()).toList()) {
            position = processStand(stand, salon, lockedInvoices, position);
        }

        for (Conference conference : conferences.stream().filter(conference -> !conference.getStatus().isInvalidStatus()).toList()) {
            position = processConference(conference, salon, lockedInvoices, position);
        }

        position = processMeal(
            MEAL1,
            participation.getNbMeal1(),
            messageSource.getMessage("saturday.midday", null, Locale.FRENCH),
            salon.getPriceMeal1(),
            lockedInvoices,
            position
        );
        position = processMeal(
            MEAL2,
            participation.getNbMeal2(),
            messageSource.getMessage("saturday.evening", null, Locale.FRENCH),
            salon.getPriceMeal2(),
            lockedInvoices,
            position
        );
        processMeal(
            MEAL3,
            participation.getNbMeal3(),
            messageSource.getMessage("sunday.midday", null, Locale.FRENCH),
            salon.getPriceMeal3(),
            lockedInvoices,
            position
        );

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

    private void copyPayments(InvoicingPlan plan, Set<Payment> payments) {
        plan
            .getPayments()
            .forEach(payment -> {
                payments.add(new Payment(payment));
            });
    }

    private void removeObsoleteStandInvoices(Set<Invoice> lockedInvoices, List<Stand> stands) {
        stands.forEach(stand -> {
            if (stand.getStatus().isInvalidStatus()) {
                lockedInvoices.removeIf(invoice -> (invoice.getType().isFromStand()) && stand.getId().equals(invoice.getReferenceId()));
            }
        });

        lockedInvoices.removeIf(
            invoice ->
                (invoice.getType().isFromStand()) && stands.stream().map(Stand::getId).noneMatch(id -> id.equals(invoice.getReferenceId()))
        );
    }

    private Long processStand(Stand stand, Salon salon, Set<Invoice> lockedInvoices, Long position) {
        Double defaultPrice = stand.getDimension() == null
            ? 0
            : salon
                .getPriceStandSalons()
                .stream()
                .filter(priceStand -> priceStand.getDimension().getId().equals(stand.getDimension().getId()))
                .findFirst()
                .map(PriceStandSalon::getPrice)
                .orElse(0.0);

        position += 1;

        updateOrCreateInvoice(
            lockedInvoices,
            stand.getId(),
            STAND,
            stand.getDimension() != null ? stand.getDimension().getDimension() : "unknown dimension",
            1L,
            defaultPrice,
            position
        );

        if (stand.getShared()) {
            position += 1;

            updateOrCreateInvoice(
                lockedInvoices,
                stand.getId(),
                SHARED,
                stand.getDimension() != null ? stand.getDimension().getDimension() : "unknown dimension",
                1L,
                salon.getPriceSharingStand(),
                position
            );
        }

        return position;
    }

    private void removeObsoleteConferenceInvoices(Set<Invoice> lockedInvoices, List<Conference> conferences) {
        conferences.forEach(conference -> {
            if (conference.getStatus().isInvalidStatus()) {
                lockedInvoices.removeIf(
                    invoice -> (invoice.getType().isFromConference()) && conference.getId().equals(invoice.getReferenceId())
                );
            }
        });

        lockedInvoices.removeIf(
            invoice ->
                invoice.getType().isFromConference() &&
                conferences.stream().map(Conference::getId).noneMatch(id -> id.equals(invoice.getReferenceId()))
        );
    }

    private Long processConference(Conference conference, Salon salon, Set<Invoice> lockedInvoices, Long position) {
        Invoice lockedInvoice = lockedInvoices
            .stream()
            .filter(invoice -> invoice.getType() == CONFERENCE && invoice.getReferenceId().equals(conference.getId()))
            .findFirst()
            .orElse(null);

        position += 1;

        if (lockedInvoice != null) {
            lockedInvoice.setPosition(position);
            lockedInvoice.setDefaultAmount(salon.getPriceConference());
        } else {
            lockedInvoices.add(
                createInvoice(conference.getId(), CONFERENCE, conference.getTitle(), 1L, salon.getPriceConference(), position)
            );
        }

        return position;
    }

    private Long processMeal(Type type, Long mealCount, String description, Double price, Set<Invoice> lockedInvoices, Long position) {
        if (mealCount != null && mealCount > 0) {
            position += 1;

            Invoice invoiceMealLocked = lockedInvoices
                .stream()
                .filter(invoice -> invoice.getType() == type && invoice.getLock())
                .findFirst()
                .orElse(null);
            if (invoiceMealLocked != null) {
                invoiceMealLocked.setPosition(position);
                invoiceMealLocked.setDefaultAmount(price);
                invoiceMealLocked.setQuantity(mealCount);
            } else {
                lockedInvoices.add(createInvoice(null, type, description, mealCount, price, position));
            }
        } else {
            lockedInvoices.removeIf(invoice -> invoice.getType() == type);
        }

        return position;
    }

    private void updateOrCreateInvoice(
        Set<Invoice> lockedInvoices,
        UUID referenceId,
        Type type,
        String description,
        Long quantity,
        Double defaultAmount,
        Long position
    ) {
        Invoice lockedInvoice = lockedInvoices
            .stream()
            .filter(invoice -> invoice.getType() == type && invoice.getReferenceId().equals(referenceId))
            .findFirst()
            .orElse(null);

        if (lockedInvoice != null) {
            lockedInvoice.setPosition(position);
            lockedInvoice.setDefaultAmount(defaultAmount);
        } else {
            lockedInvoices.add(createInvoice(referenceId, type, description, quantity, defaultAmount, position));
        }
    }

    private Invoice createInvoice(UUID referenceId, Type type, String label, Long quantity, Double defaultAmount, Long position) {
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
        return chaine != null ? chaine.substring(0, Math.min(30, chaine.length())) : null;
    }
}
