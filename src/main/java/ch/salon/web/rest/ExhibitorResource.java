package ch.salon.web.rest;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.ExhibitorService;
import ch.salon.service.ParticipationService;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.ExhibitorDTO;
import ch.salon.service.dto.ParticipationDTO;
import jakarta.validation.Valid;
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
import org.springframework.web.bind.annotation.RestController;
import tech.jhipster.web.util.ResponseUtil;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static ch.salon.service.ExhibitorService.ENTITY_NAME;
import static org.springframework.http.ResponseEntity.created;
import static org.springframework.http.ResponseEntity.noContent;
import static org.springframework.http.ResponseEntity.ok;
import static tech.jhipster.web.util.HeaderUtil.createEntityCreationAlert;
import static tech.jhipster.web.util.HeaderUtil.createEntityDeletionAlert;
import static tech.jhipster.web.util.HeaderUtil.createEntityUpdateAlert;

/**
 * REST controller for managing {@link ch.salon.domain.Exhibitor}.
 */
@RestController
@RequestMapping("/api/exhibitors")
@Transactional
public class ExhibitorResource {

    private static final Logger log = LoggerFactory.getLogger(ExhibitorResource.class);
    private final ExhibitorService exhibitorService;
    private final ParticipationService participationService;

    @Value("${jhipster.clientApp.name}") private String applicationName;

    public ExhibitorResource(ExhibitorService exhibitorService, ParticipationService participationService) {
        this.exhibitorService = exhibitorService;
        this.participationService = participationService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<ExhibitorDTO> createExhibitor(
            @Valid @RequestBody ExhibitorDTO exhibitor) throws URISyntaxException {
        log.debug("REST request to save Exhibitor : {}", exhibitor);

        UUID id = exhibitorService.create(exhibitor);

        return created(new URI("/api/exhibitors/" + id)).headers(
                createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString())).body(exhibitor);
    }

    @PutMapping("/{idExhibitor}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<ExhibitorDTO> updateExhibitor(
            @PathVariable(value = "idExhibitor", required = false) final UUID idExhibitor,
            @Valid @RequestBody ExhibitorDTO exhibitor) throws URISyntaxException {
        log.debug("REST request to update Exhibitor : {}, {}", idExhibitor, exhibitor);

        exhibitor = exhibitorService.update(idExhibitor, exhibitor);

        return ok().headers(createEntityUpdateAlert(applicationName, true, ENTITY_NAME, exhibitor.getId().toString()))
                   .body(exhibitor);
    }

    @GetMapping("/{idExhibitor}/participations")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<List<ParticipationDTO>> getParticipationsFromExhibitor(
            @PathVariable(value = "idExhibitor", required = false) final UUID idExhibitor) throws URISyntaxException {
        List<ParticipationDTO> participations = participationService.getParticipationsFromExhibitor(idExhibitor);

        return ResponseUtil.wrapOrNotFound(Optional.of(participations));
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<ExhibitorDTO> getAllExhibitors() {
        log.debug("REST request to get all Exhibitors");

        return exhibitorService.findAll();
    }

    @GetMapping("/{idExhibitor}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<ExhibitorDTO> getExhibitor(@PathVariable("idExhibitor") UUID idExhibitor) {
        log.debug("REST request to get Exhibitor : {}", idExhibitor);

        return ResponseUtil.wrapOrNotFound(exhibitorService.get(idExhibitor));
    }

    @DeleteMapping("/{idExhibitor}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deleteExhibitor(@PathVariable("idExhibitor") UUID idExhibitor) {
        log.debug("REST request to delete Exhibitor : {}", idExhibitor);

        exhibitorService.delete(idExhibitor);

        return noContent().headers(
                createEntityDeletionAlert(applicationName, true, ENTITY_NAME, idExhibitor.toString())).build();
    }

    @GetMapping("/{idExhibitor}/events")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<EventLogDTO> getAllLogs(@PathVariable(value = "idExhibitor", required = false) final UUID idExhibitor) {
        log.debug("REST request to get all EventLogs");

        return exhibitorService.findAllEventLogs(idExhibitor);
    }
}
