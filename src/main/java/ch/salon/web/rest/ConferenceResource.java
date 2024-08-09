package ch.salon.web.rest;

import static ch.salon.service.ConferenceService.ENTITY_NAME;

import ch.salon.domain.Conference;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.ConferenceService;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/conferences")
@Transactional
public class ConferenceResource {

    private static final Logger log = LoggerFactory.getLogger(ConferenceResource.class);
    private final ConferenceService conferenceService;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public ConferenceResource(ConferenceService conferenceService) {
        this.conferenceService = conferenceService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Conference> createConference(@Valid @RequestBody Conference conference) throws URISyntaxException {
        log.debug("REST request to save Conference : {}", conference);

        UUID id = conferenceService.create(conference);

        return ResponseEntity.created(new URI("/api/conferences/" + id))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(conference);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Conference> updateConference(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody Conference conference
    ) throws URISyntaxException {
        log.debug("REST request to update Conference : {}, {}", id, conference);

        conference = conferenceService.update(id, conference);

        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, conference.getId().toString()))
            .body(conference);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public List<Conference> getAllConferences(
        @RequestParam(name = "idSalon", required = false) String idSalon,
        @RequestParam(name = "idParticipation", required = false) String idParticipation
    ) {
        log.debug("REST request to get all Conferences");

        return conferenceService.findAll(idSalon, idParticipation);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Conference> getConference(@PathVariable("id") UUID id) {
        log.debug("REST request to get Conference : {}", id);

        return ResponseUtil.wrapOrNotFound(conferenceService.get(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> deleteConference(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Conference : {}", id);

        conferenceService.delete(id);

        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
