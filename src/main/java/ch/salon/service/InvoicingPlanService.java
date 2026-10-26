package ch.salon.service;

import ch.salon.domain.Invoice;
import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.InvoicingPlanReminder;
import ch.salon.domain.Participation;
import ch.salon.domain.Payment;
import ch.salon.domain.enumeration.*;
import ch.salon.repository.InvoiceRepository;
import ch.salon.repository.InvoicingPlanReminderRepository;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.PaymentRepository;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.InvoiceDTO;
import ch.salon.service.dto.InvoicingPlanDTO;
import ch.salon.service.dto.InvoicingPlanListDTO;
import ch.salon.service.dto.PaymentDTO;
import ch.salon.service.mapper.EventLogMapper;
import ch.salon.service.mapper.InvoiceMapper;
import ch.salon.service.mapper.InvoicingPlanMapper;
import ch.salon.service.mapper.PaymentMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import lombok.AllArgsConstructor;
import org.apache.commons.lang3.StringUtils;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static ch.salon.domain.enumeration.EntityType.INVOICE_PLAN;
import static ch.salon.domain.enumeration.Type.POSTAL_FEE;

@Service
@AllArgsConstructor
public class InvoicingPlanService {

    public static final String ENTITY_NAME = "invoicingPlan";
    /** Frais fixes facturés lorsque la facture est envoyée par la poste. */
    public static final double POSTAL_FEE_AMOUNT = 3.00;
    private final EventLogService eventLogService;

    private final InvoicingPlanRepository repository;
    private final InvoicingPlanReminderRepository reminderRepository;

    private final ParticipationRepository participationRepository;
    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;

    private final PaymentMapper paymentMapper;
    private final InvoiceMapper invoiceMapper;
    private final InvoicingPlanMapper invoicingPlanMapper;
    private final EventLogMapper eventLogMapper;

    private final MessageSource messageSource;

    public List<InvoicingPlanListDTO> findAllBySalonId(UUID idSalon) {
        List<InvoicingPlan> invoicingPlans = repository.findByParticipation_Salon_Id(idSalon);

        Map<UUID, List<Instant>> remindersByPlan = findRemindersByPlan(
                invoicingPlans.stream().map(InvoicingPlan::getId).toList());

        return invoicingPlans.stream()
                .map(invoicingPlan -> {
                    InvoicingPlanListDTO dto = invoicingPlanMapper.toListDto(invoicingPlan);
                    dto.setReminderDates(remindersByPlan.getOrDefault(invoicingPlan.getId(), List.of()));
                    return dto;
                })
                .toList();
    }

    public InvoicingPlanDTO findOne(UUID idInvoicingPlan) {
        if (idInvoicingPlan == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = repository.findById(idInvoicingPlan).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        return invoicingPlanMapper.toDto(invoicingPlan);
    }

    /** Dates de rappel de plusieurs plans, chargées en une seule requête. */
    private Map<UUID, List<Instant>> findRemindersByPlan(List<UUID> idInvoicingPlans) {
        if (idInvoicingPlans.isEmpty()) {
            return Map.of();
        }

        return reminderRepository.findByInvoicingPlanIdInOrderBySentDateAsc(idInvoicingPlans).stream()
                .collect(Collectors.groupingBy(InvoicingPlanReminder::getInvoicingPlanId,
                        Collectors.mapping(InvoicingPlanReminder::getSentDate, Collectors.toList())));
    }

    public InvoiceDTO createInvoice(UUID idInvoicingPlan, InvoiceDTO invoiceDTO) {
        if (idInvoicingPlan == null || invoiceDTO == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = repository.findById(idInvoicingPlan).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        Invoice invoiceToCreate = invoiceMapper.toEntity(invoiceDTO);
        invoiceToCreate.setNature(invoiceDTO.getNature() != null ? invoiceDTO.getNature() : InvoiceNature.SERVICE);
        invoiceToCreate.setCustomAmount(normalizeAmount(invoiceToCreate.getNature(), invoiceDTO.getCustomAmount()));
        invoiceToCreate.setDefaultAmount(invoiceToCreate.getCustomAmount());
        invoiceToCreate = this.invoiceRepository.save(invoiceToCreate);

        invoicingPlan.getInvoices().add(invoiceToCreate);
        invoicingPlan = repository.save(invoicingPlan);
        this.eventLogService.eventFromSystem("Ligne de facture ajoutée", EventType.ACTION, INVOICE_PLAN,
                invoicingPlan.getId(), null);
        return invoiceMapper.toDto(invoiceToCreate);
    }

    public InvoiceDTO updateInvoice(UUID idInvoicingPlan, UUID idInvoice, InvoiceDTO invoiceDTO) {
        if (idInvoicingPlan == null || invoiceDTO == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = repository.findById(idInvoicingPlan).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        Invoice invoiceFound =
                invoicingPlan.getInvoices().stream().filter(invoice -> invoice.getId().equals(idInvoice)).findFirst()
                        .orElseThrow();

        InvoiceNature nature = invoiceDTO.getNature() != null ? invoiceDTO.getNature() : InvoiceNature.SERVICE;
        Double customAmount = normalizeAmount(nature, invoiceDTO.getCustomAmount());

        if (!Objects.equals(invoiceFound.getCustomAmount(), customAmount)) {
            this.eventLogService.eventFromSystem("Ligne de facture modifiée", EventType.ACTION, INVOICE_PLAN,
                    invoicingPlan.getId(), null);
        }

        invoiceFound.setLabel(invoiceDTO.getLabel());
        invoiceFound.setDefaultAmount(normalizeAmount(nature,
                invoiceDTO.getDefaultAmount() != null ? invoiceDTO.getDefaultAmount() : invoiceDTO.getCustomAmount()));
        invoiceFound.setCustomAmount(customAmount);
        if (invoiceDTO.getQuantity() != null) {
            invoiceFound.setQuantity(invoiceDTO.getQuantity());
        }
        invoiceFound.setGenerationDate(Instant.now());
        invoiceFound.setExtraInformation(invoiceDTO.getExtraInformation());
        invoiceFound.setLock(invoiceDTO.getLock());
        invoiceFound.setNature(nature);

        repository.save(invoicingPlan);

        return invoiceMapper.toDto(invoiceFound);
    }

    /**
     * Le montant est toujours saisi en valeur absolue : c'est la nature de la ligne qui porte le
     * signe. On évite ainsi qu'une ligne soit qualifiée de réduction simplement parce qu'un
     * montant négatif a été tapé.
     */
    private Double normalizeAmount(InvoiceNature nature, Double amount) {
        if (amount == null) {
            throw new BadRequestAlertException("Amount is required", ENTITY_NAME, "amountnull");
        }

        double absolute = Math.abs(amount);

        return nature == InvoiceNature.SERVICE ? absolute : -absolute;
    }

    public void deleteInvoice(UUID idInvoicingPlan, UUID idInvoice) {        InvoicingPlan invoicingPlan = repository.getReferenceById(idInvoicingPlan);

        Invoice invoiceFound =
                invoicingPlan.getInvoices().stream().filter(invoice -> invoice.getId().equals(idInvoice)).findFirst()
                        .orElseThrow();

        invoicingPlan.getInvoices().remove(invoiceFound);

        this.repository.save(invoicingPlan);

        this.eventLogService.eventFromSystem("Ligne de facture supprimé", EventType.PAYMENT, INVOICE_PLAN,
                invoicingPlan.getId(), null);
    }

    public PaymentDTO createPayment(UUID idInvoicingPlan, PaymentDTO paymentDTO) {
        if (paymentDTO.getId() != null) {
            throw new BadRequestAlertException("A new payment cannot already have an ID", ENTITY_NAME, "id.exists");
        }

        InvoicingPlan invoicingPlan = repository.getReferenceById(idInvoicingPlan);
        Payment payment = paymentMapper.toEntity(paymentDTO);
        payment.setLabel(resolvePaymentLabel(paymentDTO.getPaymentMode(), paymentDTO.getLabel()));
        payment = this.paymentRepository.save(payment);

        invoicingPlan.getPayments().add(payment);
        invoicingPlan = this.repository.save(invoicingPlan);

        this.eventLogService.eventFromSystem("Paiement ajouté", EventType.PAYMENT, INVOICE_PLAN,
                invoicingPlan.getId(), null);
        return paymentMapper.toDto(payment);
    }

    public PaymentDTO updatePayment(final UUID idInvoicingPlan, final UUID idPayment, PaymentDTO paymentDTO) {
        if (idPayment == null || paymentDTO == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        InvoicingPlan invoicingPlan = repository.findById(idInvoicingPlan).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        Payment paymentFound =
                invoicingPlan.getPayments().stream().filter(payment -> payment.getId().equals(idPayment)).findFirst()
                        .orElseThrow();

        if (!Objects.equals(paymentDTO.getAmount(), paymentFound.getAmount())) {
            this.eventLogService.eventFromSystem("Paiement modifié", EventType.PAYMENT, INVOICE_PLAN,
                    invoicingPlan.getId(), null);
        }

        paymentFound.setPaymentMode(paymentDTO.getPaymentMode());
        paymentFound.setBillingDate(paymentDTO.getBillingDate());
        paymentFound.setLabel(resolvePaymentLabel(paymentDTO.getPaymentMode(), paymentDTO.getLabel()));
        paymentFound.setExtraInformation(paymentDTO.getExtraInformation());
        paymentFound.setAmount(paymentDTO.getAmount());

        repository.save(invoicingPlan);

        return paymentMapper.toDto(paymentFound);
    }

    /**
     * Le libellé imprimé sur la facture et la quittance découle du mode de paiement : l'admin ne
     * le saisit que pour le mode « Autre ». La note interne du paiement n'apparaît jamais sur un
     * document client.
     */
    private String resolvePaymentLabel(Mode mode, String customLabel) {
        if (mode == null || mode == Mode.OTHER) {
            String label = customLabel != null ? customLabel.trim() : "";
            if (label.isEmpty()) {
                throw new BadRequestAlertException("A custom label is required", ENTITY_NAME, "label.required");
            }
            return label;
        }

        return messageSource.getMessage("payment." + mode.name().toLowerCase(Locale.ROOT) + ".label", null,
                Locale.FRENCH);
    }

    public void deletePayment(UUID idInvoicingPlan, UUID idPayment) {
        InvoicingPlan invoicingPlan = repository.getReferenceById(idInvoicingPlan);

        Payment paymentFound =
                invoicingPlan.getPayments().stream().filter(payment -> payment.getId().equals(idPayment)).findFirst()
                        .orElseThrow();

        invoicingPlan.getPayments().remove(paymentFound);
        this.repository.save(invoicingPlan);

        this.eventLogService.eventFromSystem("Paiement supprimé", EventType.PAYMENT, INVOICE_PLAN,
                invoicingPlan.getId(), null);
    }

    public List<EventLogDTO> findAllEventLogs(UUID idInvoicingPlan) {
        if (idInvoicingPlan == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return this.eventLogService.findAllEventLog(INVOICE_PLAN, idInvoicingPlan).stream()
                .map(eventLogMapper::toDto).toList();
    }

    public List<InvoicingPlanDTO> findAll(String idParticipation) {
        if (StringUtils.isNotBlank(idParticipation)) {
            List<InvoicingPlan> invoicingPlans =
                    repository.findByParticipationIdOrderByBillingNumberAsc(UUID.fromString(idParticipation));
            return invoicingPlans.stream().map(invoicingPlanMapper::toDto).toList();
        }

        throw new IllegalStateException("No filter given");
    }

    public boolean switchArrangement(UUID idInvoicingPlan) {
        InvoicingPlan invoicingPlan = repository.findById(idInvoicingPlan).orElseThrow();

        if (invoicingPlan.getState() != State.DRAFT && invoicingPlan.getState() != State.ISOLATED) {
            throw new IllegalStateException("Invoicing plan must be in state Draft or Isolated to switch arrangment");
        }

        invoicingPlan.setNeedArrangement(!invoicingPlan.getNeedArrangement());

        if (invoicingPlan.getNeedArrangement()) {
            this.eventLogService.eventFromSystem("Facture avec arrangement", EventType.ACTION, INVOICE_PLAN,
                    invoicingPlan.getId(), null);
        } else {
            this.eventLogService.eventFromSystem("Facture sans arrangement", EventType.ACTION, INVOICE_PLAN,
                    invoicingPlan.getId(), null);
        }

        repository.save(invoicingPlan);

        return invoicingPlan.getNeedArrangement();
    }

    public String switchInvoiceSendingMethod(UUID idInvoicingPlan, InvoiceSendingMethod invoiceSendingMethod) {
        InvoicingPlan invoicingPlan = repository.findById(idInvoicingPlan).orElseThrow();

        if (invoicingPlan.getState() != State.DRAFT && invoicingPlan.getState() != State.ISOLATED) {
            throw new IllegalStateException("Invoicing plan must be in state Draft or Isolated to switch sending method");
        }

        if (invoicingPlan.getInvoiceSendingMethod() == InvoiceSendingMethod.EMAIL &&
                invoiceSendingMethod == InvoiceSendingMethod.POSTAL) {
            invoicingPlan.setInvoiceSendingMethod(invoiceSendingMethod);
            manageInvoiceSendingMethod(invoicingPlan);
            this.eventLogService.eventFromSystem("Facture à envoyer par la poste", EventType.ACTION, INVOICE_PLAN,
                    invoicingPlan.getId(), null);
        } else if (invoicingPlan.getInvoiceSendingMethod() == InvoiceSendingMethod.POSTAL &&
                invoiceSendingMethod == InvoiceSendingMethod.EMAIL) {
            invoicingPlan.setInvoiceSendingMethod(invoiceSendingMethod);
            manageInvoiceSendingMethod(invoicingPlan);
            this.eventLogService.eventFromSystem("Facture à envoyer par émail", EventType.ACTION, INVOICE_PLAN,
                    invoicingPlan.getId(), null);
        }

        repository.save(invoicingPlan);

        return invoicingPlan.getInvoiceSendingMethod().name().toLowerCase();
    }

    public void manageInvoiceSendingMethod(InvoicingPlan plan) {
        if (plan.getInvoiceSendingMethod() == InvoiceSendingMethod.POSTAL &&
                !plan.getInvoices().stream().anyMatch(invoice -> invoice.getType() == POSTAL_FEE)) {
            Invoice postalFee = new Invoice();
            postalFee.setPosition((long) plan.getInvoices().size() + 1);
            postalFee.setReferenceId(null);
            postalFee.setLock(false);
            postalFee.setNature(InvoiceNature.SERVICE);
            postalFee.setGenerationDate(Instant.now());
            postalFee.setType(POSTAL_FEE);
            postalFee.setLabel(sub(messageSource.getMessage("invoice.sending-postal.label", null, Locale.FRENCH)));
            postalFee.setQuantity(1L);
            postalFee.setDefaultAmount(POSTAL_FEE_AMOUNT);
            postalFee.setCustomAmount(POSTAL_FEE_AMOUNT);

            plan.getInvoices().add(postalFee);
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

        this.eventLogService.eventFromSystem("Facture crée par splitting", EventType.EVENT, EntityType.INVOICE_PLAN,
                currentInvoicingPlan.getId(), null);
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
