package ch.salon.web.rest;

import static ch.salon.service.InvoicingPlanService.*;

import ch.salon.domain.InvoicingPlan;
import ch.salon.domain.InvoicingPlan;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.repository.InvoicingPlanRepository;
import ch.salon.service.InvoicingPlanService;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/invoicing-plans")
@Transactional
public class InvoicingPlanResource {

    private static final Logger log = LoggerFactory.getLogger(InvoicingPlanResource.class);

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final InvoicingPlanService invoicingPlanService;

    public InvoicingPlanResource(InvoicingPlanService invoicingPlanService) {
        this.invoicingPlanService = invoicingPlanService;
    }

    @PostMapping("")
    public ResponseEntity<InvoicingPlan> createInvoicingPlan(@RequestBody InvoicingPlan invoicingPlan) throws URISyntaxException {
        log.debug("REST request to save InvoicingPlan : {}", invoicingPlan);

        UUID id = invoicingPlanService.create(invoicingPlan);

        return ResponseEntity.created(new URI("/api/invoicing-plans/" + id))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(invoicingPlan);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvoicingPlan> updateInvoicingPlan(
        @PathVariable(value = "id", required = false) final UUID id,
        @RequestBody InvoicingPlan invoicingPlan
    ) {
        log.debug("REST request to update InvoicingPlan : {}, {}", id, invoicingPlan);

        invoicingPlan = invoicingPlanService.update(id, invoicingPlan);

        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, invoicingPlan.getId().toString()))
            .body(invoicingPlan);
    }

    @PatchMapping("/generation")
    public void generateInvoicingPlan(@RequestParam(name = "idParticipation", required = false) String idParticipation) {
        log.debug("REST request to get all Participations");
        invoicingPlanService.generateInvoicingPlan(idParticipation);
    }

    @PatchMapping("{id}/send")
    public void switchLock(@PathVariable(value = "id", required = false) final UUID id) {
        invoicingPlanService.send(id);
    }

    @PatchMapping("{id}/invoices/{idInvoice}/lock")
    public void switchLock(
        @PathVariable(value = "id", required = false) final UUID id,
        @PathVariable(name = "idInvoice", required = false) UUID idInvoice
    ) {
        invoicingPlanService.switchLock(id, idInvoice);
    }

    @GetMapping("")
    public List<InvoicingPlan> getAllInvoicingPlans(@RequestParam(name = "idParticipation", required = false) String idParticipation) {
        log.debug("REST request to get all InvoicingPlans");

        return invoicingPlanService.findAll(idParticipation);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoicingPlan> getInvoicingPlan(@PathVariable("id") UUID id) {
        log.debug("REST request to get InvoicingPlan : {}", id);

        return ResponseUtil.wrapOrNotFound(invoicingPlanService.get(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoicingPlan(@PathVariable("id") UUID id) {
        log.debug("REST request to delete InvoicingPlan : {}", id);

        invoicingPlanService.delete(id);

        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
