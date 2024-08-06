package ch.salon.web.rest;

import static ch.salon.service.StandService.*;

import ch.salon.domain.Stand;
import ch.salon.service.StandService;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/stands")
@Transactional
public class StandResource {

    private static final Logger log = LoggerFactory.getLogger(StandResource.class);

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final StandService standService;

    public StandResource(StandService standService) {
        this.standService = standService;
    }

    @PostMapping("")
    public ResponseEntity<Stand> createStand(@Valid @RequestBody Stand stand) throws URISyntaxException {
        log.debug("REST request to save Stand : {}", stand);
        if (stand.getId() != null) {
            throw new BadRequestAlertException("A new stand cannot already have an ID", ENTITY_NAME, "idexists");
        }
        UUID id = standService.create(stand);

        return ResponseEntity.created(new URI("/api/stands/" + id))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(stand);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Stand> updateStand(@PathVariable(value = "id", required = false) final UUID id, @Valid @RequestBody Stand stand) {
        log.debug("REST request to update Stand : {}, {}", id, stand);

        stand = standService.update(id, stand);

        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, stand.getId().toString()))
            .body(stand);
    }

    @GetMapping("")
    public List<Stand> getAllStands(
        @RequestParam(name = "idSalon", required = false) String idSalon,
        @RequestParam(name = "idParticipation", required = false) String idParticipation
    ) {
        log.debug("REST request to get all Stands");

        return standService.findAll(idSalon, idParticipation);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Stand> getStand(@PathVariable("id") UUID id) {
        log.debug("REST request to get Stand : {}", id);

        return ResponseUtil.wrapOrNotFound(standService.get(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStand(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Stand : {}", id);

        standService.delete(id);

        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
