package ch.salon.web.rest;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.StandService;
import ch.salon.service.WorkshopService;
import ch.salon.service.dto.WorkshopDTO;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ch.salon.utils.ResponseUtil;
import ch.salon.utils.ResourceUtil;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.UUID;

import static ch.salon.service.WorkshopService.ENTITY_NAME;

@RestController
@RequestMapping("/api/admin/workshops")
@Transactional
public class AdminWorkshopResource {

    private static final Logger log = LoggerFactory.getLogger(AdminWorkshopResource.class);
    private final WorkshopService workshopService;

    public AdminWorkshopResource(WorkshopService workshopService) {
        this.workshopService = workshopService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<WorkshopDTO> createWorkshop(@Valid @RequestBody WorkshopDTO workshop) {
        log.debug("REST request to save Workshop : {}", workshop);

        UUID id = workshopService.create(workshop);

        return ResourceUtil.created(ENTITY_NAME, id, "/api/admin/workshops").body(workshop);
    }

    @PutMapping("/{idWorkshop}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<WorkshopDTO> updateWorkshop(
            @PathVariable(value = "idWorkshop", required = false) final UUID idWorkshop,
            @Valid @RequestBody WorkshopDTO workshop) throws URISyntaxException {
        log.debug("REST request to update Workshop : {}, {}", idWorkshop, workshop);

        workshop = workshopService.update(idWorkshop, workshop);

        return ResourceUtil.updated(ENTITY_NAME, workshop.getId()).body(workshop);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<WorkshopDTO> getAllWorkshops(@RequestParam(name = "idSalon", required = false) UUID idSalon,
            @RequestParam(name = "idParticipation", required = false) UUID idParticipation) {
        log.debug("REST request to get all Workshops");

        return workshopService.findAll(idSalon, idParticipation);
    }

    @GetMapping("/{idWorkshop}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<WorkshopDTO> getWorkshop(@PathVariable("idWorkshop") UUID idWorkshop) {
        log.debug("REST request to get Workshop : {}", idWorkshop);

        return ResponseUtil.wrapOrNotFound(workshopService.get(idWorkshop));
    }

    @DeleteMapping("/{idWorkshop}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deleteWorkshop(@PathVariable("idWorkshop") UUID idWorkshop) {
        log.debug("REST request to delete Workshop : {}", idWorkshop);

        workshopService.delete(idWorkshop);

        return ResourceUtil.deleted(StandService.ENTITY_NAME, idWorkshop).build();
    }
}
