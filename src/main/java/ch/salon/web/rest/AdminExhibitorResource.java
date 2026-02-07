package ch.salon.web.rest;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.ExhibitorService;
import ch.salon.service.ParticipationService;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.ExhibitorDTO;
import ch.salon.service.dto.ExhibitorLightDTO;
import ch.salon.service.dto.ParticipationDTO;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import ch.salon.utils.ResponseUtil;
import ch.salon.utils.ResourceUtil;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static ch.salon.service.ExhibitorService.ENTITY_NAME;

/**
 * REST controller for managing {@link ch.salon.domain.Exhibitor}.
 */
@RestController
@RequestMapping("/api/admin/exhibitors")
@Transactional
public class AdminExhibitorResource {

    private static final Logger log = LoggerFactory.getLogger(AdminExhibitorResource.class);
    private final ExhibitorService exhibitorService;
    private final ParticipationService participationService;


    public AdminExhibitorResource(ExhibitorService exhibitorService, ParticipationService participationService) {
        this.exhibitorService = exhibitorService;
        this.participationService = participationService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<ExhibitorDTO> createExhibitor(@Valid @RequestBody ExhibitorDTO exhibitor) {
        log.debug("REST request to save Exhibitor : {}", exhibitor);

        UUID id = exhibitorService.create(exhibitor);

        return ResourceUtil.created(ENTITY_NAME, id, "/api/admin/exhibitors").body(exhibitor);
    }

    @PutMapping("/{idExhibitor}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<ExhibitorDTO> updateExhibitor(
            @PathVariable(value = "idExhibitor", required = false) final UUID idExhibitor,
            @Valid @RequestBody ExhibitorDTO exhibitor) {
        log.debug("REST request to update Exhibitor : {}, {}", idExhibitor, exhibitor);

        exhibitor = exhibitorService.update(idExhibitor, exhibitor);

        return ResourceUtil.updated(ENTITY_NAME, exhibitor.getId()).body(exhibitor);
    }

    @GetMapping("/{idExhibitor}/participations")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<List<ParticipationDTO>> getParticipationsFromExhibitor(
            @PathVariable(value = "idExhibitor", required = false) final UUID idExhibitor) {
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

        return ResourceUtil.deleted(ENTITY_NAME, idExhibitor).build();
    }

    @GetMapping("/{idExhibitor}/events")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<EventLogDTO> getAllLogs(@PathVariable(value = "idExhibitor", required = false) final UUID idExhibitor) {
        log.debug("REST request to get all EventLogs");

        return exhibitorService.findAllEventLogs(idExhibitor);
    }

    @GetMapping("/newsletter")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<ExhibitorLightDTO> getExhibitorsWithActiveNewsletter() {
        return exhibitorService.getExhibitorsWithActiveNewsletter();
    }

}
