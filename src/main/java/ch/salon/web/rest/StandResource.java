package ch.salon.web.rest;

import ch.salon.domain.Stand;
import ch.salon.repository.StandRepository;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.StreamSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

/**
 * REST controller for managing {@link ch.salon.domain.Stand}.
 */
@RestController
@RequestMapping("/api/stands")
@Transactional
public class StandResource {

    private static final Logger log = LoggerFactory.getLogger(StandResource.class);

    private static final String ENTITY_NAME = "stand";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final StandRepository standRepository;

    public StandResource(StandRepository standRepository) {
        this.standRepository = standRepository;
    }

    @PostMapping("")
    public ResponseEntity<Stand> createStand(@RequestBody Stand stand) throws URISyntaxException {
        log.debug("REST request to save Stand : {}", stand);
        if (stand.getId() != null) {
            throw new BadRequestAlertException("A new stand cannot already have an ID", ENTITY_NAME, "idexists");
        }
        stand = standRepository.save(stand);
        return ResponseEntity.created(new URI("/api/stands/" + stand.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, stand.getId().toString()))
            .body(stand);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Stand> updateStand(@PathVariable(value = "id", required = false) final UUID id, @RequestBody Stand stand)
        throws URISyntaxException {
        log.debug("REST request to update Stand : {}, {}", id, stand);
        if (stand.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, stand.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!standRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        stand = standRepository.save(stand);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, stand.getId().toString()))
            .body(stand);
    }

    @GetMapping("")
    public List<Stand> getAllStands(@RequestParam(name = "idSalon", required = false) String idSalon) {
        if (idSalon != null) {
            log.debug("REST request to get all Stands for a salon");
            return standRepository.findAllStandsBySalon_Id(UUID.fromString(idSalon));
        } else {
            log.debug("REST request to get all Stands");
            return standRepository.findAll();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Stand> getStand(@PathVariable("id") UUID id) {
        log.debug("REST request to get Stand : {}", id);
        Optional<Stand> stand = standRepository.findById(id);
        return ResponseUtil.wrapOrNotFound(stand);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStand(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Stand : {}", id);
        standRepository.deleteById(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
