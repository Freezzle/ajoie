package ch.salon.web.rest;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.ConferenceService;
import ch.salon.service.dto.ConferenceDTO;
import ch.salon.utils.ResourceUtil;
import ch.salon.utils.ResponseUtil;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URISyntaxException;
import java.util.List;
import java.util.UUID;

import static ch.salon.service.ConferenceService.ENTITY_NAME;

@RestController
@RequestMapping("/api/admin/conferences")
@Transactional
public class AdminConferenceResource {

    private static final Logger log = LoggerFactory.getLogger(AdminConferenceResource.class);
    private final ConferenceService conferenceService;

    public AdminConferenceResource(ConferenceService conferenceService) {
        this.conferenceService = conferenceService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<ConferenceDTO> createConference(@Valid @RequestBody ConferenceDTO conference) {
        log.debug("REST request to save Conference : {}", conference);

        UUID id = conferenceService.create(conference);

        return ResourceUtil.created(ENTITY_NAME, id, "/api/admin/conferences").body(conference);
    }

    @PutMapping("/{idConference}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<ConferenceDTO> updateConference(
            @PathVariable(value = "idConference", required = false) final UUID idConference,
            @Valid @RequestBody ConferenceDTO conference) throws URISyntaxException {
        log.debug("REST request to update Conference : {}, {}", idConference, conference);

        conference = conferenceService.update(idConference, conference);

        return ResourceUtil.updated(ENTITY_NAME, conference.getId()).body(conference);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<ConferenceDTO> getAllConferences(@RequestParam(name = "idSalon", required = false) UUID idSalon,
                                                 @RequestParam(name = "idParticipation", required = false) UUID idParticipation) {
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

        return ResourceUtil.deleted(ENTITY_NAME, idConference).build();
    }
}
