package ch.salon.web.rest;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.ExhibitorService;
import ch.salon.service.ExhibitorDuplicateService;
import ch.salon.service.ParticipationService;
import ch.salon.service.dto.DuplicateCandidateDTO;
import ch.salon.service.dto.DuplicatePreviewDTO;
import ch.salon.service.dto.EventLogDTO;
import ch.salon.service.dto.ExhibitorDTO;
import ch.salon.service.dto.ExhibitorLightDTO;
import ch.salon.service.dto.ExhibitorListDTO;
import ch.salon.service.dto.ParticipationDTO;
import ch.salon.utils.ResourceUtil;
import ch.salon.utils.ResponseUtil;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

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
    private final ExhibitorDuplicateService exhibitorDuplicateService;


    public AdminExhibitorResource(ExhibitorService exhibitorService, ParticipationService participationService,
            ExhibitorDuplicateService exhibitorDuplicateService) {
        this.exhibitorService = exhibitorService;
        this.participationService = participationService;
        this.exhibitorDuplicateService = exhibitorDuplicateService;
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

    @PatchMapping("/{idExhibitor}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<ExhibitorDTO> patchExhibitor(
            @PathVariable(value = "idExhibitor", required = false) final UUID idExhibitor,
            @RequestBody ExhibitorDTO exhibitor) {
        log.debug("REST request to patch Exhibitor : {}, {}", idExhibitor, exhibitor);

        exhibitor = exhibitorService.patch(idExhibitor, exhibitor);

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
    public List<ExhibitorListDTO> getAllExhibitors() {
        log.debug("REST request to get all Exhibitors");

        return exhibitorService.findAllForList();
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

    @GetMapping("/{idExhibitor}/duplicate-candidates")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<DuplicateCandidateDTO> getDuplicateCandidates(@PathVariable("idExhibitor") UUID idExhibitor) {
        return exhibitorDuplicateService.getDuplicateCandidates(idExhibitor);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<DuplicateCandidateDTO> searchExhibitors(@RequestParam("q") String q) {
        return exhibitorDuplicateService.searchCandidates(q, 20);
    }

    @GetMapping("/{idExhibitor}/duplicate-preview")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public DuplicatePreviewDTO getDuplicatePreview(@PathVariable("idExhibitor") UUID idExhibitor,
            @RequestParam("target") UUID targetExhibitorId) {
        return exhibitorDuplicateService.buildPreview(idExhibitor, targetExhibitorId);
    }

}
