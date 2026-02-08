package ch.salon.web.rest;

import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.InvoicingPlanService;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.InvoiceDTO;
import ch.salon.service.dto.PaymentDTO;
import ch.salon.utils.ResourceUtil;
import ch.salon.web.rest.dto.SplitInvoicing;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URISyntaxException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/invoicing-plans")
@Transactional
public class AdminInvoicingPlanResource {

    private static final String ENTITY_NAME = "invoicingPlan";

    private static final Logger log = LoggerFactory.getLogger(AdminInvoicingPlanResource.class);
    private final InvoicingPlanService invoicingPlanService;

    public AdminInvoicingPlanResource(InvoicingPlanService invoicingPlanService) {
        this.invoicingPlanService = invoicingPlanService;
    }

    @PostMapping("{idInvoicingPlan}/split-invoices")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> splitInvoicingPlan(
            @PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan,
            @RequestBody SplitInvoicing splitInvoicing) {
        invoicingPlanService.splitInvoicingPlan(idInvoicingPlan, splitInvoicing.getInvoicesIds(), false, false);

        return ResourceUtil.updatedWithMessageKey(ENTITY_NAME + ".splitting.updated", idInvoicingPlan).body(null);
    }

    @PutMapping("{idInvoicingPlan}/switch-arrangement")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> switchArrangement(
            @PathVariable(value = "idInvoicingPlan") final UUID idInvoicingPlan) throws Exception {
        boolean withArrangement = invoicingPlanService.switchArrangement(idInvoicingPlan);

        if (withArrangement) {
            return ResourceUtil.updatedWithMessageKey(ENTITY_NAME + ".arrangement.activated", idInvoicingPlan).body(null);
        }
        return ResourceUtil.updatedWithMessageKey(ENTITY_NAME + ".arrangement.deactivated", idInvoicingPlan).body(null);
    }

    @PutMapping("{idInvoicingPlan}/switch-invoice-method/{method}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> switchInvoiceSendingMethod(
            @PathVariable(value = "idInvoicingPlan") final UUID idInvoicingPlan,
            @PathVariable(value = "method") InvoiceSendingMethod method) {
        String newMethod = invoicingPlanService.switchInvoiceSendingMethod(idInvoicingPlan, method);

        return ResourceUtil.updatedWithMessageKey(ENTITY_NAME + ".invoiceSendingMethod." + newMethod + ".updated", idInvoicingPlan).body(null);
    }

    @PostMapping("{idInvoicingPlan}/invoices")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<InvoiceDTO> createInvoice(
            @PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan,
            @RequestBody InvoiceDTO invoiceDTO) {
        InvoiceDTO invoice = invoicingPlanService.createInvoice(idInvoicingPlan, invoiceDTO);
        return ResourceUtil.created("invoice", invoice.getId(), "/api/admin/invoicing-plans/" + idInvoicingPlan + "/invoices").body(invoice);
    }

    @PutMapping("{idInvoicingPlan}/invoices/{idInvoice}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<InvoiceDTO> updateInvoice(
            @PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan,
            @PathVariable(name = "idInvoice", required = false) UUID idInvoice, @RequestBody InvoiceDTO invoiceDTO) {
        InvoiceDTO invoice = invoicingPlanService.updateInvoice(idInvoicingPlan, idInvoice, invoiceDTO);
        return ResourceUtil.updated("invoice", idInvoice).body(invoice);
    }

    @DeleteMapping("/{idInvoicingPlan}/invoices/{idInvoice}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deleteInvoice(@PathVariable("idInvoicingPlan") UUID idInvoicingPlan,
                                              @PathVariable("idInvoice") UUID idInvoice) {
        log.debug("REST request to delete Invoice : {}, {}", idInvoicingPlan, idInvoice);

        this.invoicingPlanService.deleteInvoice(idInvoicingPlan, idInvoice);

        return ResourceUtil.deleted("invoice", idInvoice).build();
    }

    @PostMapping("/{idInvoicingPlan}/payments")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<PaymentDTO> createPayment(@PathVariable("idInvoicingPlan") UUID idInvoicingPlan,
                                                    @Valid @RequestBody PaymentDTO payment) throws URISyntaxException {
        log.debug("REST request to save Payment : {}", payment);

        PaymentDTO paymentDTO = this.invoicingPlanService.createPayment(idInvoicingPlan, payment);
        return ResourceUtil.created("payment", paymentDTO.getId(), "/api/admin/invoicing-plans/" + idInvoicingPlan + "/payments").body(paymentDTO);
    }

    @PutMapping("/{idInvoicingPlan}/payments/{idPayment}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<PaymentDTO> updatePayment(@PathVariable("idInvoicingPlan") UUID idInvoicingPlan,
                                                    @PathVariable("idPayment") UUID idPayment, @RequestBody PaymentDTO payment) {
        log.debug("REST request to update Payment : {}, {}, {}", idInvoicingPlan, idPayment, payment);

        PaymentDTO paymentDTO = this.invoicingPlanService.updatePayment(idInvoicingPlan, idPayment, payment);
        return ResourceUtil.updated("payment", idPayment).body(paymentDTO);
    }

    @DeleteMapping("/{idInvoicingPlan}/payments/{idPayment}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deletePayment(@PathVariable("idInvoicingPlan") UUID idInvoicingPlan,
                                              @PathVariable("idPayment") UUID idPayment) {
        log.debug("REST request to delete Payment : {}, {}", idInvoicingPlan, idPayment);

        this.invoicingPlanService.deletePayment(idInvoicingPlan, idPayment);

        return ResourceUtil.deleted("payment", idPayment).build();
    }

    @GetMapping("/{idInvoicingPlan}/events")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<EventLogDTO> getAllLogs(@PathVariable(value = "idInvoicingPlan") final UUID idInvoicingPlan) {
        log.debug("REST request to get all EventLogs for InvoicingPlan : {}", idInvoicingPlan);

        return invoicingPlanService.findAllEventLogs(idInvoicingPlan);
    }
}
