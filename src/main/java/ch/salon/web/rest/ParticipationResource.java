package ch.salon.web.rest;

import static ch.salon.service.ParticipationService.ENTITY_NAME;

import ch.salon.domain.Participation;
import ch.salon.service.ParticipationService;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/participations")
@Transactional
public class ParticipationResource {

    private static final Logger log = LoggerFactory.getLogger(ParticipationResource.class);

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final ParticipationService participationService;

    public ParticipationResource(ParticipationService participationService) {
        this.participationService = participationService;
    }

    @PostMapping("")
    public ResponseEntity<Participation> createParticipation(@RequestBody Participation participation) throws URISyntaxException {
        log.debug("REST request to save Participation : {}", participation);

        UUID id = participationService.create(participation);
        return ResponseEntity.created(new URI("/api/participations/" + id))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(participation);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Participation> updateParticipation(
        @PathVariable(value = "id", required = false) final UUID id,
        @RequestBody Participation participation
    ) throws URISyntaxException {
        log.debug("REST request to update Participation : {}, {}", id, participation);

        participation = participationService.update(id, participation);

        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, participation.getId().toString()))
            .body(participation);
    }

    @GetMapping("")
    public List<Participation> getAllParticipations(@RequestParam(name = "idSalon", required = false) String idSalon) {
        log.debug("REST request to get all Participations");

        return participationService.findAll(idSalon);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Participation> getParticipation(@PathVariable("id") UUID id) {
        log.debug("REST request to get Participation : {}", id);

        return ResponseUtil.wrapOrNotFound(participationService.get(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteParticipation(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Participation : {}", id);

        participationService.delete(id);

        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
