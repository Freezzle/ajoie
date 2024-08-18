package ch.salon.web.rest;

import static ch.salon.service.ParticipationService.ENTITY_NAME;
import static org.springframework.http.ResponseEntity.*;
import static tech.jhipster.web.util.HeaderUtil.*;

import ch.salon.domain.Participation;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.ParticipationService;
import ch.salon.service.dto.EventLogDTO;
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

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public ParticipationResource(ParticipationService participationService) {
        this.participationService = participationService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Participation> createParticipation(@RequestBody Participation participation) throws URISyntaxException {
        log.debug("REST request to save Participation : {}", participation);

        UUID id = participationService.create(participation);

        return created(new URI("/api/participations/" + id))
            .headers(createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(participation);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Participation> updateParticipation(
        @PathVariable(value = "id", required = false) final UUID id,
        @RequestBody Participation participation
    ) throws URISyntaxException {
        log.debug("REST request to update Participation : {}, {}", id, participation);

        participation = participationService.update(id, participation);

        return ok()
            .headers(createEntityUpdateAlert(applicationName, true, ENTITY_NAME, participation.getId().toString()))
            .body(participation);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public List<Participation> getAllParticipations(@RequestParam(name = "idSalon", required = false) String idSalon) {
        log.debug("REST request to get all Participations");

        return participationService.findAll(idSalon);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Participation> getParticipation(@PathVariable("id") UUID id) {
        log.debug("REST request to get Participation : {}", id);

        return ResponseUtil.wrapOrNotFound(participationService.get(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> deleteParticipation(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Participation : {}", id);

        participationService.delete(id);

        return noContent().headers(createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString())).build();
    }

    @PostMapping("/{id}/events")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> createEventLog(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody EventLogDTO eventLogDTO
    ) throws URISyntaxException {
        log.debug("REST request to save eventLog : {}", eventLogDTO);

        participationService.createEventLog(id, eventLogDTO);

        return noContent().build();
    }

    @GetMapping("/{id}/events")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public List<EventLogDTO> getAllLogs(@PathVariable(value = "id", required = false) final UUID id) {
        log.debug("REST request to get all EventLogs");

        return participationService.findAllEventLogs(id);
    }
}
