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

    /**
     * {@code POST  /stands} : Create a new stand.
     *
     * @param stand the stand to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new stand, or with status {@code 400 (Bad Request)} if the stand has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
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

    /**
     * {@code PUT  /stands/:id} : Updates an existing stand.
     *
     * @param id the id of the stand to save.
     * @param stand the stand to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated stand,
     * or with status {@code 400 (Bad Request)} if the stand is not valid,
     * or with status {@code 500 (Internal Server Error)} if the stand couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
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

    /**
     * {@code PATCH  /stands/:id} : Partial updates given fields of an existing stand, field will ignore if it is null
     *
     * @param id the id of the stand to save.
     * @param stand the stand to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated stand,
     * or with status {@code 400 (Bad Request)} if the stand is not valid,
     * or with status {@code 404 (Not Found)} if the stand is not found,
     * or with status {@code 500 (Internal Server Error)} if the stand couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<Stand> partialUpdateStand(@PathVariable(value = "id", required = false) final UUID id, @RequestBody Stand stand)
        throws URISyntaxException {
        log.debug("REST request to partial update Stand partially : {}, {}", id, stand);
        if (stand.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, stand.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!standRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<Stand> result = standRepository
            .findById(stand.getId())
            .map(existingStand -> {
                if (stand.getDescription() != null) {
                    existingStand.setDescription(stand.getDescription());
                }
                if (stand.getNbMeal1() != null) {
                    existingStand.setNbMeal1(stand.getNbMeal1());
                }
                if (stand.getNbMeal2() != null) {
                    existingStand.setNbMeal2(stand.getNbMeal2());
                }
                if (stand.getNbMeal3() != null) {
                    existingStand.setNbMeal3(stand.getNbMeal3());
                }
                if (stand.getShared() != null) {
                    existingStand.setShared(stand.getShared());
                }
                if (stand.getNbTable() != null) {
                    existingStand.setNbTable(stand.getNbTable());
                }
                if (stand.getNbChair() != null) {
                    existingStand.setNbChair(stand.getNbChair());
                }
                if (stand.getNeedElectricity() != null) {
                    existingStand.setNeedElectricity(stand.getNeedElectricity());
                }
                if (stand.getAcceptedChart() != null) {
                    existingStand.setAcceptedChart(stand.getAcceptedChart());
                }

                return existingStand;
            })
            .map(standRepository::save);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, stand.getId().toString())
        );
    }

    /**
     * {@code GET  /stands} : get all the stands.
     *
     * @param filter the filter of the request.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of stands in body.
     */
    @GetMapping("")
    public List<Stand> getAllStands(@RequestParam(name = "filter", required = false) String filter) {
        if ("billing-is-null".equals(filter)) {
            log.debug("REST request to get all Stands where billing is null");
            return StreamSupport.stream(standRepository.findAll().spliterator(), false)
                .filter(stand -> stand.getBilling() == null)
                .toList();
        }
        log.debug("REST request to get all Stands");
        return standRepository.findAll();
    }

    /**
     * {@code GET  /stands/:id} : get the "id" stand.
     *
     * @param id the id of the stand to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the stand, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Stand> getStand(@PathVariable("id") UUID id) {
        log.debug("REST request to get Stand : {}", id);
        Optional<Stand> stand = standRepository.findById(id);
        return ResponseUtil.wrapOrNotFound(stand);
    }

    /**
     * {@code DELETE  /stands/:id} : delete the "id" stand.
     *
     * @param id the id of the stand to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStand(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Stand : {}", id);
        standRepository.deleteById(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
