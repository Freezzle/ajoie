package ch.salon.web.rest;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.ExhibitorService;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.ExhibitorDTO;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.ResponseUtil;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.UUID;

import static ch.salon.service.ExhibitorService.ENTITY_NAME;
import static org.springframework.http.ResponseEntity.*;
import static tech.jhipster.web.util.HeaderUtil.*;

/**
 * REST controller for managing {@link ch.salon.domain.Exhibitor}.
 */
@RestController
@RequestMapping("/api/exhibitors")
@Transactional
public class ExhibitorResource {

    private static final Logger log = LoggerFactory.getLogger(ExhibitorResource.class);
    private final ExhibitorService exhibitorService;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public ExhibitorResource(ExhibitorService exhibitorService) {
        this.exhibitorService = exhibitorService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<ExhibitorDTO> createExhibitor(
        @Valid @RequestBody ExhibitorDTO exhibitor) throws URISyntaxException {
        log.debug("REST request to save Exhibitor : {}", exhibitor);

        UUID id = exhibitorService.create(exhibitor);

        return created(new URI("/api/exhibitors/" + id)).headers(
            createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString())).body(exhibitor);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<ExhibitorDTO> updateExhibitor(@PathVariable(value = "id", required = false) final UUID id,
                                                        @Valid @RequestBody
                                                        ExhibitorDTO exhibitor) throws URISyntaxException {
        log.debug("REST request to update Exhibitor : {}, {}", id, exhibitor);

        exhibitor = exhibitorService.update(id, exhibitor);

        return ok().headers(createEntityUpdateAlert(applicationName, true, ENTITY_NAME, exhibitor.getId().toString()))
            .body(exhibitor);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public List<ExhibitorDTO> getAllExhibitors() {
        log.debug("REST request to get all Exhibitors");

        return exhibitorService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<ExhibitorDTO> getExhibitor(@PathVariable("id") UUID id) {
        log.debug("REST request to get Exhibitor : {}", id);

        return ResponseUtil.wrapOrNotFound(exhibitorService.get(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> deleteExhibitor(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Exhibitor : {}", id);

        exhibitorService.delete(id);

        return noContent().headers(createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }

    @PostMapping("/{id}/events")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> createEventLog(@PathVariable(value = "id", required = false) final UUID id,
                                               @Valid @RequestBody EventLogDTO eventLogDTO) throws URISyntaxException {
        log.debug("REST request to save eventLog : {}", eventLogDTO);

        exhibitorService.createEventLog(id, eventLogDTO);

        return noContent().build();
    }

    @GetMapping("/{id}/events")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public List<EventLogDTO> getAllLogs(@PathVariable(value = "id", required = false) final UUID id) {
        log.debug("REST request to get all EventLogs");

        return exhibitorService.findAllEventLogs(id);
    }
}
