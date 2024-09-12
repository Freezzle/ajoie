package ch.salon.web.rest;

import static ch.salon.service.ConferenceService.ENTITY_NAME;
import static org.springframework.http.ResponseEntity.*;
import static tech.jhipster.web.util.HeaderUtil.*;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.ConferenceService;
import ch.salon.service.dto.ConferenceDTO;
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
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<ConferenceDTO> createConference(@Valid @RequestBody ConferenceDTO conference) throws URISyntaxException {
        log.debug("REST request to save Conference : {}", conference);

        UUID id = conferenceService.create(conference);

        return created(new URI("/api/conferences/" + id))
            .headers(createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(conference);
    }

    @PutMapping("/{idConference}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<ConferenceDTO> updateConference(
        @PathVariable(value = "idConference", required = false) final UUID idConference,
        @Valid @RequestBody ConferenceDTO conference
    ) throws URISyntaxException {
        log.debug("REST request to update Conference : {}, {}", idConference, conference);

        conference = conferenceService.update(idConference, conference);

        return ok().headers(createEntityUpdateAlert(applicationName, true, ENTITY_NAME, conference.getId().toString())).body(conference);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<ConferenceDTO> getAllConferences(
        @RequestParam(name = "idSalon", required = false) String idSalon,
        @RequestParam(name = "idParticipation", required = false) String idParticipation
    ) {
        log.debug("REST request to get all Conferences");

        return conferenceService.findAll(idSalon, idParticipation);
    }

    @GetMapping("/{idConference}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<ConferenceDTO> getConference(@PathVariable("idConference") UUID idConference) {
        log.debug("REST request to get Conference : {}", idConference);

        return ResponseUtil.wrapOrNotFound(conferenceService.get(idConference));
    }

    @DeleteMapping("/{idConference}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deleteConference(@PathVariable("idConference") UUID idConference) {
        log.debug("REST request to delete Conference : {}", idConference);

        conferenceService.delete(idConference);

        return noContent().headers(createEntityDeletionAlert(applicationName, true, ENTITY_NAME, idConference.toString())).build();
    }
}
