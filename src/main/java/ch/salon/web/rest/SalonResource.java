package ch.salon.web.rest;

import static ch.salon.service.SalonService.*;

import ch.salon.domain.Salon;
import ch.salon.service.SalonService;
import ch.salon.web.rest.dto.SalonStats;
import jakarta.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/salons")
@Transactional
public class SalonResource {

    private static final Logger log = LoggerFactory.getLogger(SalonResource.class);

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final SalonService salonService;

    public SalonResource(SalonService salonService) {
        this.salonService = salonService;
    }

    @PostMapping("")
    public ResponseEntity<Salon> createSalon(@Valid @RequestBody Salon salon) throws URISyntaxException {
        log.debug("REST request to save Salon : {}", salon);

        UUID id = salonService.create(salon);

        return ResponseEntity.created(new URI("/api/salons/" + id))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(salon);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Salon> updateSalon(@PathVariable(value = "id", required = false) final UUID id, @Valid @RequestBody Salon salon)
        throws URISyntaxException {
        log.debug("REST request to update Salon : {}, {}", id, salon);

        salon = salonService.update(id, salon);

        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, salon.getId().toString()))
            .body(salon);
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<SalonStats> getStats(@PathVariable(value = "id", required = false) final UUID id) {
        log.debug("REST request to get stats from Salon : {}", id);

        SalonStats stats = salonService.getStats(id);

        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(stats);
    }

    @GetMapping("")
    public List<Salon> getAllSalons() {
        log.debug("REST request to get all Salons");

        return salonService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Salon> getSalon(@PathVariable("id") UUID id) {
        log.debug("REST request to get Salon : {}", id);
        return ResponseUtil.wrapOrNotFound(salonService.get(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSalon(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Salon : {}", id);

        salonService.delete(id);

        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
