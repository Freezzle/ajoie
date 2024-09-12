package ch.salon.web.rest;

import static ch.salon.service.ParticipationService.ENTITY_NAME;
import static org.springframework.http.ResponseEntity.*;
import static tech.jhipster.web.util.HeaderUtil.*;

import ch.salon.domain.Participation;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.InvoicingPlanService;
import ch.salon.service.ParticipationService;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.InvoicingPlanDTO;
import jakarta.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/participations")
@Transactional
public class ParticipationResource {

    private static final Logger log = LoggerFactory.getLogger(ParticipationResource.class);
    private final ParticipationService participationService;
    private final InvoicingPlanService invoicingPlanService;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public ParticipationResource(ParticipationService participationService, InvoicingPlanService invoicingPlanService) {
        this.participationService = participationService;
        this.invoicingPlanService = invoicingPlanService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Participation> createParticipation(@RequestBody Participation participation) throws URISyntaxException {
        log.debug("REST request to save Participation : {}", participation);

        UUID id = participationService.create(participation);

        return created(new URI("/api/participations/" + id))
            .headers(createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(participation);
    }

    @PutMapping("/{idParticipation}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Participation> updateParticipation(
        @PathVariable(value = "idParticipation", required = false) final UUID idParticipation,
        @RequestBody Participation participation
    ) throws URISyntaxException {
        log.debug("REST request to update Participation : {}, {}", idParticipation, participation);

        participation = participationService.update(idParticipation, participation);

        return ok().headers(createEntityUpdateAlert(applicationName, true, ENTITY_NAME, idParticipation.toString())).body(participation);
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

        return noContent().headers(createEntityDeletionAlert(applicationName, true, ENTITY_NAME, idParticipation.toString())).build();
    }

    @GetMapping("/{idParticipation}/invoicing-plans")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<InvoicingPlanDTO> getAllInvoicingPlans(@PathVariable(name = "idParticipation", required = false) String idParticipation) {
        log.debug("REST request to get all InvoicingPlans");

        return invoicingPlanService.findAll(idParticipation);
    }

    @PatchMapping("/{idParticipation}/refresh-invoicing-plans")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public void generateInvoicingPlan(@PathVariable(name = "idParticipation", required = false) String idParticipation) {
        log.debug("REST request to get all Participations");

        invoicingPlanService.refreshInvoicingPlans(idParticipation);
    }

    @PostMapping("/{idParticipation}/events")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> createEventLog(
        @PathVariable(value = "idParticipation", required = false) final UUID idParticipation,
        @Valid @RequestBody EventLogDTO eventLogDTO
    ) throws URISyntaxException {
        log.debug("REST request to save eventLog : {}", eventLogDTO);

        participationService.createEventLog(idParticipation, eventLogDTO);

        return noContent().build();
    }

    @GetMapping("/{idParticipation}/events")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<EventLogDTO> getAllLogs(@PathVariable(value = "idParticipation", required = false) final UUID idParticipation) {
        log.debug("REST request to get all EventLogs");

        return participationService.findAllEventLogs(idParticipation);
    }
}
