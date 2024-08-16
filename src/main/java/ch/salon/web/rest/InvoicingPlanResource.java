package ch.salon.web.rest;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.InvoicingPlanService;
import ch.salon.service.dto.InvoicingPlanDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.ResponseUtil;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.UUID;

import static ch.salon.service.InvoicingPlanService.ENTITY_NAME;
import static org.springframework.http.ResponseEntity.*;
import static tech.jhipster.web.util.HeaderUtil.*;

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

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<InvoicingPlanDTO> createInvoicingPlan(
        @RequestBody InvoicingPlanDTO invoicingPlan) throws URISyntaxException {
        log.debug("REST request to save InvoicingPlan : {}", invoicingPlan);

        UUID id = invoicingPlanService.create(invoicingPlan);

        return created(new URI("/api/invoicing-plans/" + id)).headers(
            createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString())).body(invoicingPlan);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<InvoicingPlanDTO> updateInvoicingPlan(
        @PathVariable(value = "id", required = false) final UUID id, @RequestBody InvoicingPlanDTO invoicingPlan) {
        log.debug("REST request to update InvoicingPlan : {}, {}", id, invoicingPlan);

        invoicingPlan = invoicingPlanService.update(id, invoicingPlan);

        return ok().headers(
                createEntityUpdateAlert(applicationName, true, ENTITY_NAME, invoicingPlan.getId().toString()))
            .body(invoicingPlan);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public List<InvoicingPlanDTO> getAllInvoicingPlans(
        @RequestParam(name = "idParticipation", required = false) String idParticipation) {
        log.debug("REST request to get all InvoicingPlans");

        return invoicingPlanService.findAll(idParticipation);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<InvoicingPlanDTO> getInvoicingPlan(@PathVariable("id") UUID id) {
        log.debug("REST request to get InvoicingPlan : {}", id);

        return ResponseUtil.wrapOrNotFound(invoicingPlanService.get(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> deleteInvoicingPlan(@PathVariable("id") UUID id) {
        log.debug("REST request to delete InvoicingPlan : {}", id);

        invoicingPlanService.delete(id);

        return noContent().headers(createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }

    @PatchMapping("/generation")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public void generateInvoicingPlan(
        @RequestParam(name = "idParticipation", required = false) String idParticipation) {
        log.debug("REST request to get all Participations");

        invoicingPlanService.generateInvoicingPlan(idParticipation);
    }

    @PatchMapping("{id}/send")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> sendInvoiceEmail(@PathVariable(value = "id", required = false) final UUID id) {
        invoicingPlanService.send(id);

        return noContent().build();
    }

    @PatchMapping("{id}/invoices/{idInvoice}/lock")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> switchLock(@PathVariable(value = "id", required = false) final UUID id,
                                           @PathVariable(name = "idInvoice", required = false) UUID idInvoice) {
        invoicingPlanService.switchLock(id, idInvoice);

        return noContent().build();
    }
}
