package ch.salon.web.rest;

import static ch.salon.service.StandService.ENTITY_NAME;
import static org.springframework.http.ResponseEntity.*;
import static tech.jhipster.web.util.HeaderUtil.*;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.StandService;
import ch.salon.service.dto.StandDTO;
import ch.salon.web.rest.errors.BadRequestAlertException;
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
@RequestMapping("/api/stands")
@Transactional
public class StandResource {

    private static final Logger log = LoggerFactory.getLogger(StandResource.class);
    private final StandService standService;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public StandResource(StandService standService) {
        this.standService = standService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<StandDTO> createStand(@Valid @RequestBody StandDTO stand) throws URISyntaxException {
        log.debug("REST request to save Stand : {}", stand);

        UUID id = standService.create(stand);

        return created(new URI("/api/stands/" + id))
            .headers(createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(stand);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<StandDTO> updateStand(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody StandDTO stand
    ) {
        log.debug("REST request to update Stand : {}, {}", id, stand);

        stand = standService.update(id, stand);

        return ok().headers(createEntityUpdateAlert(applicationName, true, ENTITY_NAME, stand.getId().toString())).body(stand);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public List<StandDTO> getAllStands(
        @RequestParam(name = "idSalon", required = false) String idSalon,
        @RequestParam(name = "idParticipation", required = false) String idParticipation
    ) {
        log.debug("REST request to get all Stands");

        return standService.findAll(idSalon, idParticipation);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<StandDTO> getStand(@PathVariable("id") UUID id) {
        log.debug("REST request to get Stand : {}", id);

        return ResponseUtil.wrapOrNotFound(standService.get(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> deleteStand(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Stand : {}", id);

        standService.delete(id);

        return noContent().headers(createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString())).build();
    }
}
