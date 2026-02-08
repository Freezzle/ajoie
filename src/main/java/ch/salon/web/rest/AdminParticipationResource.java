package ch.salon.web.rest;

import ch.salon.domain.Participation;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.InvoicingPlanService;
import ch.salon.service.ParticipationService;
import ch.salon.service.RefreshInvoicingPlansService;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.InvoicingPlanDTO;
import ch.salon.utils.ResourceUtil;
import ch.salon.utils.ResponseUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URISyntaxException;
import java.util.List;
import java.util.UUID;

import static ch.salon.service.ParticipationService.ENTITY_NAME;

@RestController
@RequestMapping("/api/admin/participations")
@Transactional
public class AdminParticipationResource {

    private static final Logger log = LoggerFactory.getLogger(AdminParticipationResource.class);
    private final ParticipationService participationService;
    private final InvoicingPlanService invoicingPlanService;
    private final RefreshInvoicingPlansService refreshInvoicingPlansService;

    public AdminParticipationResource(ParticipationService participationService,
                                      InvoicingPlanService invoicingPlanService, RefreshInvoicingPlansService refreshInvoicingPlansService) {
        this.participationService = participationService;
        this.invoicingPlanService = invoicingPlanService;
        this.refreshInvoicingPlansService = refreshInvoicingPlansService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Participation> createParticipation(@RequestBody Participation participation) {
        log.debug("REST request to save Participation : {}", participation);

        UUID id = participationService.create(participation);

        return ResourceUtil.created(ENTITY_NAME, id, "/api/admin/participations").body(participation);
    }

    @PutMapping("/{idParticipation}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Participation> updateParticipation(
            @PathVariable(value = "idParticipation", required = false) final UUID idParticipation,
            @RequestBody Participation participation) throws URISyntaxException {
        log.debug("REST request to update Participation : {}, {}", idParticipation, participation);

        participation = participationService.update(idParticipation, participation);

        return ResourceUtil.updated(ENTITY_NAME, idParticipation).body(participation);
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

        return ResourceUtil.deleted(ENTITY_NAME, idParticipation).build();
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
