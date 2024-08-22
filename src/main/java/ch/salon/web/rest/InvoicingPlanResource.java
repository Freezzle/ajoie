package ch.salon.web.rest;

import static org.springframework.http.ResponseEntity.noContent;
import static tech.jhipster.web.util.HeaderUtil.createEntityDeletionAlert;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.InvoicingPlanService;
import ch.salon.service.dto.InvoiceDTO;
import ch.salon.service.dto.PaymentDTO;
import jakarta.validation.Valid;
import java.net.URISyntaxException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/invoicing-plans")
@Transactional
public class InvoicingPlanResource {

    private static final Logger log = LoggerFactory.getLogger(InvoicingPlanResource.class);
    private final InvoicingPlanService invoicingPlanService;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public InvoicingPlanResource(InvoicingPlanService invoicingPlanService) {
        this.invoicingPlanService = invoicingPlanService;
    }

    @PatchMapping("{idInvoicingPlan}/send")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> sendInvoiceEmail(@PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan)
        throws Exception {
        invoicingPlanService.send(idInvoicingPlan);

        return noContent().build();
    }

    @PostMapping("{idInvoicingPlan}/invoices")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<InvoiceDTO> updateInvoice(
        @PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan,
        @RequestBody InvoiceDTO invoiceDTO
    ) {
        return ResponseUtil.wrapOrNotFound(invoicingPlanService.createInvoice(idInvoicingPlan, invoiceDTO));
    }

    @PutMapping("{idInvoicingPlan}/invoices/{idInvoice}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<InvoiceDTO> updateInvoice(
        @PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan,
        @PathVariable(name = "idInvoice", required = false) UUID idInvoice,
        @RequestBody InvoiceDTO invoiceDTO
    ) {
        return ResponseUtil.wrapOrNotFound(invoicingPlanService.updateInvoice(idInvoicingPlan, idInvoice, invoiceDTO));
    }

    @PostMapping("/{idInvoicingPlan}/payments")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<PaymentDTO> createPayment(
        @PathVariable("idInvoicingPlan") UUID idInvoicingPlan,
        @Valid @RequestBody PaymentDTO payment
    ) throws URISyntaxException {
        log.debug("REST request to save Payment : {}", payment);

        return ResponseUtil.wrapOrNotFound(this.invoicingPlanService.createPayment(idInvoicingPlan, payment));
    }

    @PutMapping("/{idInvoicingPlan}/payments/{idPayment}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<PaymentDTO> updatePayment(
        @PathVariable("idInvoicingPlan") UUID idInvoicingPlan,
        @PathVariable("idPayment") UUID idPayment,
        @RequestBody PaymentDTO payment
    ) {
        log.debug("REST request to update Payment : {}, {}, {}", idInvoicingPlan, idPayment, payment);

        return ResponseUtil.wrapOrNotFound(this.invoicingPlanService.updatePayment(idInvoicingPlan, idPayment, payment));
    }

    @DeleteMapping("/{idInvoicingPlan}/payments/{idPayment}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> deletePayment(
        @PathVariable("idInvoicingPlan") UUID idInvoicingPlan,
        @PathVariable("idPayment") UUID idPayment
    ) {
        log.debug("REST request to delete Payment : {}, {}", idInvoicingPlan, idPayment);

        this.invoicingPlanService.deletePayment(idInvoicingPlan, idPayment);

        return noContent()
            .headers(createEntityDeletionAlert(applicationName, true, InvoicingPlanService.ENTITY_NAME, idPayment.toString()))
            .build();
    }
}
