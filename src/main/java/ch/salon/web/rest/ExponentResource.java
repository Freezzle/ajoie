package ch.salon.web.rest;

import ch.salon.domain.Exponent;
import ch.salon.repository.ExponentRepository;
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
 * REST controller for managing {@link ch.salon.domain.Exponent}.
 */
@RestController
@RequestMapping("/api/exponents")
@Transactional
public class ExponentResource {

    private static final Logger log = LoggerFactory.getLogger(ExponentResource.class);

    private static final String ENTITY_NAME = "exponent";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final ExponentRepository exponentRepository;

    public ExponentResource(ExponentRepository exponentRepository) {
        this.exponentRepository = exponentRepository;
    }

    /**
     * {@code POST  /exponents} : Create a new exponent.
     *
     * @param exponent the exponent to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new exponent, or with status {@code 400 (Bad Request)} if the exponent has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<Exponent> createExponent(@Valid @RequestBody Exponent exponent) throws URISyntaxException {
        log.debug("REST request to save Exponent : {}", exponent);
        if (exponent.getId() != null) {
            throw new BadRequestAlertException("A new exponent cannot already have an ID", ENTITY_NAME, "idexists");
        }
        exponent = exponentRepository.save(exponent);
        return ResponseEntity.created(new URI("/api/exponents/" + exponent.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, exponent.getId().toString()))
            .body(exponent);
    }

    /**
     * {@code PUT  /exponents/:id} : Updates an existing exponent.
     *
     * @param id the id of the exponent to save.
     * @param exponent the exponent to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated exponent,
     * or with status {@code 400 (Bad Request)} if the exponent is not valid,
     * or with status {@code 500 (Internal Server Error)} if the exponent couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Exponent> updateExponent(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody Exponent exponent
    ) throws URISyntaxException {
        log.debug("REST request to update Exponent : {}, {}", id, exponent);
        if (exponent.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, exponent.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!exponentRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        exponent = exponentRepository.save(exponent);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, exponent.getId().toString()))
            .body(exponent);
    }

    /**
     * {@code PATCH  /exponents/:id} : Partial updates given fields of an existing exponent, field will ignore if it is null
     *
     * @param id the id of the exponent to save.
     * @param exponent the exponent to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated exponent,
     * or with status {@code 400 (Bad Request)} if the exponent is not valid,
     * or with status {@code 404 (Not Found)} if the exponent is not found,
     * or with status {@code 500 (Internal Server Error)} if the exponent couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<Exponent> partialUpdateExponent(
        @PathVariable(value = "id", required = false) final UUID id,
        @NotNull @RequestBody Exponent exponent
    ) throws URISyntaxException {
        log.debug("REST request to partial update Exponent partially : {}, {}", id, exponent);
        if (exponent.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, exponent.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!exponentRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<Exponent> result = exponentRepository
            .findById(exponent.getId())
            .map(existingExponent -> {
                if (exponent.getFullName() != null) {
                    existingExponent.setFullName(exponent.getFullName());
                }
                if (exponent.getEmail() != null) {
                    existingExponent.setEmail(exponent.getEmail());
                }
                if (exponent.getPhoneNumber() != null) {
                    existingExponent.setPhoneNumber(exponent.getPhoneNumber());
                }
                if (exponent.getAddress() != null) {
                    existingExponent.setAddress(exponent.getAddress());
                }
                if (exponent.getNpaLocalite() != null) {
                    existingExponent.setNpaLocalite(exponent.getNpaLocalite());
                }
                if (exponent.getExtraInformation() != null) {
                    existingExponent.setExtraInformation(exponent.getExtraInformation());
                }

                return existingExponent;
            })
            .map(exponentRepository::save);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, exponent.getId().toString())
        );
    }

    /**
     * {@code GET  /exponents} : get all the exponents.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of exponents in body.
     */
    @GetMapping("")
    public List<Exponent> getAllExponents() {
        log.debug("REST request to get all Exponents");
        return exponentRepository.findAll();
    }

    /**
     * {@code GET  /exponents/:id} : get the "id" exponent.
     *
     * @param id the id of the exponent to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the exponent, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Exponent> getExponent(@PathVariable("id") UUID id) {
        log.debug("REST request to get Exponent : {}", id);
        Optional<Exponent> exponent = exponentRepository.findById(id);
        return ResponseUtil.wrapOrNotFound(exponent);
    }

    /**
     * {@code DELETE  /exponents/:id} : delete the "id" exponent.
     *
     * @param id the id of the exponent to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExponent(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Exponent : {}", id);
        exponentRepository.deleteById(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
