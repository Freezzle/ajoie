package ch.salon.web.rest;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.InvoicingPlanService;
import ch.salon.service.dto.InvoiceDTO;
import ch.salon.service.dto.PaymentDTO;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamSource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tech.jhipster.web.util.ResponseUtil;

import java.net.URISyntaxException;
import java.util.Optional;
import java.util.UUID;

import static org.springframework.http.ResponseEntity.noContent;
import static tech.jhipster.web.util.HeaderUtil.createEntityDeletionAlert;

@RestController
@RequestMapping("/api/invoicing-plans")
@Transactional
public class InvoicingPlanResource {

    private static final Logger log = LoggerFactory.getLogger(InvoicingPlanResource.class);
    private final InvoicingPlanService invoicingPlanService;

    @Value("${jhipster.clientApp.name}") private String applicationName;

    public InvoicingPlanResource(InvoicingPlanService invoicingPlanService) {
        this.invoicingPlanService = invoicingPlanService;
    }

    @PatchMapping("{idInvoicingPlan}/send-invoice-receipt")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> sendInvoiceReceiptEmail(
            @PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan) throws Exception {
        invoicingPlanService.sendInvoiceReceipt(idInvoicingPlan);

        return noContent().build();
    }

    @PatchMapping("{idInvoicingPlan}/send-invoice")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> sendInvoiceEmail(
            @PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan) throws Exception {
        invoicingPlanService.sendInvoice(idInvoicingPlan);

        return noContent().build();
    }

    @PatchMapping("{idInvoicingPlan}/pay")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> payInvoice(
            @PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan) throws Exception {
        invoicingPlanService.payInvoice(idInvoicingPlan);

        return noContent().build();
    }

    @PatchMapping("{idInvoicingPlan}/cancel")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> cancelInvoice(
            @PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan) throws Exception {
        invoicingPlanService.cancelInvoice(idInvoicingPlan);

        return noContent().build();
    }

    @GetMapping("{idInvoicingPlan}/download-invoice")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<InputStreamSource> downloadInvoice(
            @PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan) throws Exception {
        String fileName = "invoice-" + idInvoicingPlan + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline().filename(fileName).build());

        return ResponseUtil.wrapOrNotFound(Optional.ofNullable(invoicingPlanService.downloadInvoice(idInvoicingPlan)),
                                           headers);
    }

    @DeleteMapping("{idInvoicingPlan}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deleteInvoicingPlan(
            @PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan) throws Exception {
        invoicingPlanService.deleteInvoicingPlan(idInvoicingPlan);
        return noContent().build();
    }

    @PostMapping("{idInvoicingPlan}/invoices")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<InvoiceDTO> updateInvoice(
            @PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan,
            @RequestBody InvoiceDTO invoiceDTO) {
        return ResponseUtil.wrapOrNotFound(invoicingPlanService.createInvoice(idInvoicingPlan, invoiceDTO));
    }

    @PutMapping("{idInvoicingPlan}/invoices/{idInvoice}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<InvoiceDTO> updateInvoice(
            @PathVariable(value = "idInvoicingPlan", required = false) final UUID idInvoicingPlan,
            @PathVariable(name = "idInvoice", required = false) UUID idInvoice, @RequestBody InvoiceDTO invoiceDTO) {
        return ResponseUtil.wrapOrNotFound(invoicingPlanService.updateInvoice(idInvoicingPlan, idInvoice, invoiceDTO));
    }

    @PostMapping("/{idInvoicingPlan}/payments")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<PaymentDTO> createPayment(@PathVariable("idInvoicingPlan") UUID idInvoicingPlan,
                                                    @Valid @RequestBody PaymentDTO payment) throws URISyntaxException {
        log.debug("REST request to save Payment : {}", payment);

        return ResponseUtil.wrapOrNotFound(this.invoicingPlanService.createPayment(idInvoicingPlan, payment));
    }

    @PutMapping("/{idInvoicingPlan}/payments/{idPayment}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<PaymentDTO> updatePayment(@PathVariable("idInvoicingPlan") UUID idInvoicingPlan,
                                                    @PathVariable("idPayment") UUID idPayment,
                                                    @RequestBody PaymentDTO payment) {
        log.debug("REST request to update Payment : {}, {}, {}", idInvoicingPlan, idPayment, payment);

        return ResponseUtil.wrapOrNotFound(
                this.invoicingPlanService.updatePayment(idInvoicingPlan, idPayment, payment));
    }

    @DeleteMapping("/{idInvoicingPlan}/payments/{idPayment}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deletePayment(@PathVariable("idInvoicingPlan") UUID idInvoicingPlan,
                                              @PathVariable("idPayment") UUID idPayment) {
        log.debug("REST request to delete Payment : {}, {}", idInvoicingPlan, idPayment);

        this.invoicingPlanService.deletePayment(idInvoicingPlan, idPayment);

        return noContent().headers(createEntityDeletionAlert(applicationName, true, InvoicingPlanService.ENTITY_NAME,
                                                             idPayment.toString())).build();
    }
}
