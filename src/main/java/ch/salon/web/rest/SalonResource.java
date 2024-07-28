package ch.salon.web.rest;

import ch.salon.domain.Salon;
import ch.salon.repository.SalonRepository;
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
 * REST controller for managing {@link ch.salon.domain.Salon}.
 */
@RestController
@RequestMapping("/api/salons")
@Transactional
public class SalonResource {

    private static final Logger log = LoggerFactory.getLogger(SalonResource.class);

    private static final String ENTITY_NAME = "salon";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final SalonRepository salonRepository;

    public SalonResource(SalonRepository salonRepository) {
        this.salonRepository = salonRepository;
    }

    @PostMapping("")
    public ResponseEntity<Salon> createSalon(@RequestBody Salon salon) throws URISyntaxException {
        log.debug("REST request to save Salon : {}", salon);
        if (salon.getId() != null) {
            throw new BadRequestAlertException("A new salon cannot already have an ID", ENTITY_NAME, "idexists");
        }
        salon = salonRepository.save(salon);
        return ResponseEntity.created(new URI("/api/salons/" + salon.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, salon.getId().toString()))
            .body(salon);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Salon> updateSalon(@PathVariable(value = "id", required = false) final UUID id, @RequestBody Salon salon)
        throws URISyntaxException {
        log.debug("REST request to update Salon : {}, {}", id, salon);
        if (salon.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, salon.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!salonRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        salon = salonRepository.save(salon);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, salon.getId().toString()))
            .body(salon);
    }

    @GetMapping("")
    public List<Salon> getAllSalons(@RequestParam(name = "filter", required = false) String filter) {
        if ("configuration-is-null".equals(filter)) {
            log.debug("REST request to get all Salons where configuration is null");
            return StreamSupport.stream(salonRepository.findAll().spliterator(), false)
                .filter(salon -> salon.getConfiguration() == null)
                .toList();
        }
        log.debug("REST request to get all Salons");
        return salonRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Salon> getSalon(@PathVariable("id") UUID id) {
        log.debug("REST request to get Salon : {}", id);
        Optional<Salon> salon = salonRepository.findById(id);
        return ResponseUtil.wrapOrNotFound(salon);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSalon(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Salon : {}", id);
        salonRepository.deleteById(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
