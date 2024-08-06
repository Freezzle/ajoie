package ch.salon.web.rest;

import static ch.salon.service.DimensionStandService.*;

import ch.salon.domain.DimensionStand;
import ch.salon.service.DimensionStandService;
import ch.salon.web.rest.errors.BadRequestAlertException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
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
@RequestMapping("/api/dimension-stands")
@Transactional
public class DimensionStandResource {

    private static final Logger log = LoggerFactory.getLogger(DimensionStandResource.class);

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final DimensionStandService dimensionStandService;

    public DimensionStandResource(DimensionStandService dimensionStandService) {
        this.dimensionStandService = dimensionStandService;
    }

    @PostMapping("")
    public ResponseEntity<DimensionStand> createDimensionStand(@Valid @RequestBody DimensionStand dimensionStand)
        throws URISyntaxException {
        log.debug("REST request to save DimensionStand : {}", dimensionStand);

        UUID id = dimensionStandService.create(dimensionStand);

        return ResponseEntity.created(new URI("/api/dimension-stands/" + id))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(dimensionStand);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DimensionStand> updateDimensionStand(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody DimensionStand dimensionStand
    ) throws URISyntaxException {
        log.debug("REST request to update DimensionStand : {}, {}", id, dimensionStand);

        dimensionStand = dimensionStandService.update(id, dimensionStand);

        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, dimensionStand.getId().toString()))
            .body(dimensionStand);
    }

    @GetMapping("")
    public List<DimensionStand> getAllDimensionStands() {
        log.debug("REST request to get all DimensionStands");

        return dimensionStandService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DimensionStand> getDimensionStand(@PathVariable("id") UUID id) {
        log.debug("REST request to get DimensionStand : {}", id);

        return ResponseUtil.wrapOrNotFound(dimensionStandService.get(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDimensionStand(@PathVariable("id") UUID id) {
        log.debug("REST request to delete DimensionStand : {}", id);

        dimensionStandService.delete(id);

        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
