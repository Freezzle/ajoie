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
        if (plan.getInvoiceSendingMethod() == InvoiceSendingMethod.POSTAL &&
                !plan.getInvoices().stream().anyMatch(invoice -> invoice.getType() == POSTAL_FEE)) {
            Invoice postalFee = new Invoice();
            postalFee.setPosition((long) plan.getInvoices().size() + 1);
            postalFee.setReferenceId(null);
            postalFee.setLock(false);
            postalFee.setReduction(false);
            postalFee.setGenerationDate(Instant.now());
            postalFee.setType(POSTAL_FEE);
            postalFee.setLabel(sub(messageSource.getMessage("invoice.sending-postal.label", null, Locale.FRENCH)));
            postalFee.setQuantity(1L);
            postalFee.setDefaultAmount(3.00);
            postalFee.setCustomAmount(3.00);

            plan.addInvoice(postalFee);
        } else if (plan.getInvoiceSendingMethod() == InvoiceSendingMethod.EMAIL) {
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
