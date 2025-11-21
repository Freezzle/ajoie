package ch.salon.web.rest;

import ch.salon.domain.Participation;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.InvoicingPlanService;
import ch.salon.service.ParticipationService;
import ch.salon.service.RefreshInvoicingPlansService;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.InvoicingPlanDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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
import ch.salon.utils.ResponseUtil;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.UUID;

import static ch.salon.service.ParticipationService.ENTITY_NAME;
import static org.springframework.http.ResponseEntity.created;
import static org.springframework.http.ResponseEntity.noContent;
import static org.springframework.http.ResponseEntity.ok;
import static ch.salon.utils.HeaderUtil.createEntityCreationAlert;
import static ch.salon.utils.HeaderUtil.createEntityDeletionAlert;
import static ch.salon.utils.HeaderUtil.createEntityUpdateAlert;

@RestController
@RequestMapping("/api/admin/participations")
@Transactional
public class AdminParticipationResource {

    private static final Logger log = LoggerFactory.getLogger(AdminParticipationResource.class);
    private final ParticipationService participationService;
    private final InvoicingPlanService invoicingPlanService;
    private final RefreshInvoicingPlansService refreshInvoicingPlansService;

    @Value("${salon.clientApp.name}")
    private String applicationName;

    public AdminParticipationResource(ParticipationService participationService,
            InvoicingPlanService invoicingPlanService, RefreshInvoicingPlansService refreshInvoicingPlansService) {
        this.participationService = participationService;
        this.invoicingPlanService = invoicingPlanService;
        this.refreshInvoicingPlansService = refreshInvoicingPlansService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Participation> createParticipation(@RequestBody Participation participation)
            throws URISyntaxException {
        log.debug("REST request to save Participation : {}", participation);

        UUID id = participationService.create(participation);

        return created(new URI("/api/admin/participations/" + id)).headers(
                createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString())).body(participation);
    }

    @PutMapping("/{idParticipation}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Participation> updateParticipation(
            @PathVariable(value = "idParticipation", required = false) final UUID idParticipation,
            @RequestBody Participation participation) throws URISyntaxException {
        log.debug("REST request to update Participation : {}, {}", idParticipation, participation);

        participation = participationService.update(idParticipation, participation);

        return ok().headers(createEntityUpdateAlert(applicationName, true, ENTITY_NAME, idParticipation.toString()))
                   .body(participation);
    }

    @GetMapping("/{idParticipation}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Participation> getParticipation(@PathVariable("idParticipation") UUID idParticipation) {
        log.debug("REST request to get Participation : {}", idParticipation);

        return ResponseUtil.wrapOrNotFound(participationService.get(idParticipation));
    }

    @DeleteMapping("/{idParticipation}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deleteParticipation(@PathVariable("idParticipation") UUID idParticipation) {
        log.debug("REST request to delete Participation : {}", idParticipation);

        participationService.delete(idParticipation);

        return noContent().headers(
                createEntityDeletionAlert(applicationName, true, ENTITY_NAME, idParticipation.toString())).build();
    }

    @GetMapping("/{idParticipation}/invoicing-plans")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<InvoicingPlanDTO> getAllInvoicingPlans(
            @PathVariable(name = "idParticipation", required = false) String idParticipation) {
        log.debug("REST request to get all InvoicingPlans");

        return invoicingPlanService.findAll(idParticipation);
    }

    @PatchMapping("/{idParticipation}/refresh-invoicing-plans")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public void generateInvoicingPlan(
            @PathVariable(name = "idParticipation", required = false) String idParticipation) {
        log.debug("REST request to get all Participations");

        refreshInvoicingPlansService.refreshInvoicingPlans(idParticipation);
    }

    @GetMapping("/{idParticipation}/events")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<EventLogDTO> getAllLogs(
            @PathVariable(value = "idParticipation", required = false) final UUID idParticipation) {
        log.debug("REST request to get all EventLogs");

        return participationService.findAllEventLogs(idParticipation);
    }
}
