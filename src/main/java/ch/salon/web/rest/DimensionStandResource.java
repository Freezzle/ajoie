package ch.salon.web.rest;

import ch.salon.domain.DimensionStand;
import ch.salon.repository.DimensionStandRepository;
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

/**
 * REST controller for managing {@link ch.salon.domain.DimensionStand}.
 */
@RestController
@RequestMapping("/api/dimension-stands")
@Transactional
public class DimensionStandResource {

    private static final Logger log = LoggerFactory.getLogger(DimensionStandResource.class);

    private static final String ENTITY_NAME = "dimensionStand";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final DimensionStandRepository dimensionStandRepository;

    public DimensionStandResource(DimensionStandRepository dimensionStandRepository) {
        this.dimensionStandRepository = dimensionStandRepository;
    }

    /**
     * {@code POST  /dimension-stands} : Create a new dimensionStand.
     *
     * @param dimensionStand the dimensionStand to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new dimensionStand, or with status {@code 400 (Bad Request)} if the dimensionStand has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<DimensionStand> createDimensionStand(@Valid @RequestBody DimensionStand dimensionStand)
        throws URISyntaxException {
        log.debug("REST request to save DimensionStand : {}", dimensionStand);
        if (dimensionStand.getId() != null) {
            throw new BadRequestAlertException("A new dimensionStand cannot already have an ID", ENTITY_NAME, "idexists");
        }
        dimensionStand = dimensionStandRepository.save(dimensionStand);
        return ResponseEntity.created(new URI("/api/dimension-stands/" + dimensionStand.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, dimensionStand.getId().toString()))
            .body(dimensionStand);
    }

    /**
     * {@code PUT  /dimension-stands/:id} : Updates an existing dimensionStand.
     *
     * @param id the id of the dimensionStand to save.
     * @param dimensionStand the dimensionStand to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated dimensionStand,
     * or with status {@code 400 (Bad Request)} if the dimensionStand is not valid,
     * or with status {@code 500 (Internal Server Error)} if the dimensionStand couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<DimensionStand> updateDimensionStand(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody DimensionStand dimensionStand
    ) throws URISyntaxException {
        log.debug("REST request to update DimensionStand : {}, {}", id, dimensionStand);
        if (dimensionStand.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, dimensionStand.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!dimensionStandRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        dimensionStand = dimensionStandRepository.save(dimensionStand);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, dimensionStand.getId().toString()))
            .body(dimensionStand);
    }

    /**
     * {@code PATCH  /dimension-stands/:id} : Partial updates given fields of an existing dimensionStand, field will ignore if it is null
     *
     * @param id the id of the dimensionStand to save.
     * @param dimensionStand the dimensionStand to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated dimensionStand,
     * or with status {@code 400 (Bad Request)} if the dimensionStand is not valid,
     * or with status {@code 404 (Not Found)} if the dimensionStand is not found,
     * or with status {@code 500 (Internal Server Error)} if the dimensionStand couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<DimensionStand> partialUpdateDimensionStand(
        @PathVariable(value = "id", required = false) final UUID id,
        @NotNull @RequestBody DimensionStand dimensionStand
    ) throws URISyntaxException {
        log.debug("REST request to partial update DimensionStand partially : {}, {}", id, dimensionStand);
        if (dimensionStand.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, dimensionStand.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!dimensionStandRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<DimensionStand> result = dimensionStandRepository
            .findById(dimensionStand.getId())
            .map(existingDimensionStand -> {
                if (dimensionStand.getDimension() != null) {
                    existingDimensionStand.setDimension(dimensionStand.getDimension());
                }

                return existingDimensionStand;
            })
            .map(dimensionStandRepository::save);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, dimensionStand.getId().toString())
        );
    }

    /**
     * {@code GET  /dimension-stands} : get all the dimensionStands.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of dimensionStands in body.
     */
    @GetMapping("")
    public List<DimensionStand> getAllDimensionStands() {
        log.debug("REST request to get all DimensionStands");
        return dimensionStandRepository.findAll();
    }

    /**
     * {@code GET  /dimension-stands/:id} : get the "id" dimensionStand.
     *
     * @param id the id of the dimensionStand to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the dimensionStand, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<DimensionStand> getDimensionStand(@PathVariable("id") UUID id) {
        log.debug("REST request to get DimensionStand : {}", id);
        Optional<DimensionStand> dimensionStand = dimensionStandRepository.findById(id);
        return ResponseUtil.wrapOrNotFound(dimensionStand);
    }

    /**
     * {@code DELETE  /dimension-stands/:id} : delete the "id" dimensionStand.
     *
     * @param id the id of the dimensionStand to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDimensionStand(@PathVariable("id") UUID id) {
        log.debug("REST request to delete DimensionStand : {}", id);
        dimensionStandRepository.deleteById(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
