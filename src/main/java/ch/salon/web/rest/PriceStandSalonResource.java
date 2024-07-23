package ch.salon.web.rest;

import ch.salon.domain.PriceStandSalon;
import ch.salon.repository.PriceStandSalonRepository;
import ch.salon.web.rest.errors.BadRequestAlertException;
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
 * REST controller for managing {@link ch.salon.domain.PriceStandSalon}.
 */
@RestController
@RequestMapping("/api/price-stand-salons")
@Transactional
public class PriceStandSalonResource {

    private static final Logger log = LoggerFactory.getLogger(PriceStandSalonResource.class);

    private static final String ENTITY_NAME = "priceStandSalon";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final PriceStandSalonRepository priceStandSalonRepository;

    public PriceStandSalonResource(PriceStandSalonRepository priceStandSalonRepository) {
        this.priceStandSalonRepository = priceStandSalonRepository;
    }

    /**
     * {@code POST  /price-stand-salons} : Create a new priceStandSalon.
     *
     * @param priceStandSalon the priceStandSalon to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new priceStandSalon, or with status {@code 400 (Bad Request)} if the priceStandSalon has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<PriceStandSalon> createPriceStandSalon(@RequestBody PriceStandSalon priceStandSalon) throws URISyntaxException {
        log.debug("REST request to save PriceStandSalon : {}", priceStandSalon);
        if (priceStandSalon.getId() != null) {
            throw new BadRequestAlertException("A new priceStandSalon cannot already have an ID", ENTITY_NAME, "idexists");
        }
        priceStandSalon = priceStandSalonRepository.save(priceStandSalon);
        return ResponseEntity.created(new URI("/api/price-stand-salons/" + priceStandSalon.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, priceStandSalon.getId().toString()))
            .body(priceStandSalon);
    }

    /**
     * {@code PUT  /price-stand-salons/:id} : Updates an existing priceStandSalon.
     *
     * @param id the id of the priceStandSalon to save.
     * @param priceStandSalon the priceStandSalon to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated priceStandSalon,
     * or with status {@code 400 (Bad Request)} if the priceStandSalon is not valid,
     * or with status {@code 500 (Internal Server Error)} if the priceStandSalon couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<PriceStandSalon> updatePriceStandSalon(
        @PathVariable(value = "id", required = false) final UUID id,
        @RequestBody PriceStandSalon priceStandSalon
    ) throws URISyntaxException {
        log.debug("REST request to update PriceStandSalon : {}, {}", id, priceStandSalon);
        if (priceStandSalon.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, priceStandSalon.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!priceStandSalonRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        priceStandSalon = priceStandSalonRepository.save(priceStandSalon);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, priceStandSalon.getId().toString()))
            .body(priceStandSalon);
    }

    /**
     * {@code PATCH  /price-stand-salons/:id} : Partial updates given fields of an existing priceStandSalon, field will ignore if it is null
     *
     * @param id the id of the priceStandSalon to save.
     * @param priceStandSalon the priceStandSalon to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated priceStandSalon,
     * or with status {@code 400 (Bad Request)} if the priceStandSalon is not valid,
     * or with status {@code 404 (Not Found)} if the priceStandSalon is not found,
     * or with status {@code 500 (Internal Server Error)} if the priceStandSalon couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<PriceStandSalon> partialUpdatePriceStandSalon(
        @PathVariable(value = "id", required = false) final UUID id,
        @RequestBody PriceStandSalon priceStandSalon
    ) throws URISyntaxException {
        log.debug("REST request to partial update PriceStandSalon partially : {}, {}", id, priceStandSalon);
        if (priceStandSalon.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, priceStandSalon.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!priceStandSalonRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<PriceStandSalon> result = priceStandSalonRepository
            .findById(priceStandSalon.getId())
            .map(existingPriceStandSalon -> {
                if (priceStandSalon.getPrice() != null) {
                    existingPriceStandSalon.setPrice(priceStandSalon.getPrice());
                }

                return existingPriceStandSalon;
            })
            .map(priceStandSalonRepository::save);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, priceStandSalon.getId().toString())
        );
    }

    /**
     * {@code GET  /price-stand-salons} : get all the priceStandSalons.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of priceStandSalons in body.
     */
    @GetMapping("")
    public List<PriceStandSalon> getAllPriceStandSalons() {
        log.debug("REST request to get all PriceStandSalons");
        return priceStandSalonRepository.findAll();
    }

    /**
     * {@code GET  /price-stand-salons/:id} : get the "id" priceStandSalon.
     *
     * @param id the id of the priceStandSalon to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the priceStandSalon, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PriceStandSalon> getPriceStandSalon(@PathVariable("id") UUID id) {
        log.debug("REST request to get PriceStandSalon : {}", id);
        Optional<PriceStandSalon> priceStandSalon = priceStandSalonRepository.findById(id);
        return ResponseUtil.wrapOrNotFound(priceStandSalon);
    }

    /**
     * {@code DELETE  /price-stand-salons/:id} : delete the "id" priceStandSalon.
     *
     * @param id the id of the priceStandSalon to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePriceStandSalon(@PathVariable("id") UUID id) {
        log.debug("REST request to delete PriceStandSalon : {}", id);
        priceStandSalonRepository.deleteById(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
