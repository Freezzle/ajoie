package ch.salon.web.rest;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.StandService;
import ch.salon.service.dto.StandDTO;
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
import java.util.UUID;

import static ch.salon.service.StandService.ENTITY_NAME;

@RestController
@RequestMapping("/api/admin/stands")
@Transactional
public class AdminStandResource {

    private static final Logger log = LoggerFactory.getLogger(AdminStandResource.class);
    private final StandService standService;


    public AdminStandResource(StandService standService) {
        this.standService = standService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<StandDTO> createStand(@Valid @RequestBody StandDTO stand) {
        log.debug("REST request to save Stand : {}", stand);

        UUID id = standService.create(stand);

        return ResourceUtil.created(ENTITY_NAME, id, "/api/admin/stands").body(stand);
    }

    @PutMapping("/{idStand}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<StandDTO> updateStand(@PathVariable(value = "idStand", required = false) final UUID idStand,
                                                @Valid @RequestBody StandDTO stand) {
        log.debug("REST request to update Stand : {}, {}", idStand, stand);

        stand = standService.update(idStand, stand);

        return ResourceUtil.updated(ENTITY_NAME, stand.getId()).body(stand);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<StandDTO> getAllStands(@RequestParam(name = "idSalon", required = false) UUID idSalon,
                                       @RequestParam(name = "idParticipation", required = false) UUID idParticipation) {
        log.debug("REST request to get all Stands");

        return standService.findAll(idSalon, idParticipation);
    }

    @GetMapping("/{idStand}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<StandDTO> getStand(@PathVariable("idStand") UUID idStand) {
        log.debug("REST request to get Stand : {}", idStand);

        return ResponseUtil.wrapOrNotFound(standService.get(idStand));
    }

    @DeleteMapping("/{idStand}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deleteStand(@PathVariable("idStand") UUID idStand) {
        log.debug("REST request to delete Stand : {}", idStand);

        standService.delete(idStand);

        return ResourceUtil.deleted(ENTITY_NAME, idStand).build();
    }
}
