package ch.salon.web.rest;

import static ch.salon.service.SalonService.ENTITY_NAME;
import static org.springframework.http.ResponseEntity.*;
import static tech.jhipster.web.util.HeaderUtil.*;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.SalonService;
import ch.salon.service.dto.SalonDTO;
import ch.salon.web.rest.dto.SalonStats;
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
import org.springframework.web.bind.annotation.RestController;
import tech.jhipster.web.util.HeaderUtil;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/salons")
@Transactional
public class SalonResource {

    private static final Logger log = LoggerFactory.getLogger(SalonResource.class);
    private final SalonService salonService;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public SalonResource(SalonService salonService) {
        this.salonService = salonService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<SalonDTO> createSalon(@Valid @RequestBody SalonDTO salon) throws URISyntaxException {
        log.debug("REST request to save Salon : {}", salon);

        UUID id = salonService.create(salon);

        return created(new URI("/api/salons/" + id))
            .headers(createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(salon);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<SalonDTO> updateSalon(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody SalonDTO salon
    ) {
        log.debug("REST request to update Salon : {}, {}", id, salon);

        salon = salonService.update(id, salon);

        return ok().headers(createEntityUpdateAlert(applicationName, true, ENTITY_NAME, salon.getId().toString())).body(salon);
    }

    @GetMapping("/{id}/stats")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<SalonStats> getStats(@PathVariable(value = "id", required = false) final UUID id) {
        log.debug("REST request to get stats from Salon : {}", id);

        SalonStats stats = salonService.getStats(id);

        return ok().headers(createEntityUpdateAlert(applicationName, true, ENTITY_NAME, id.toString())).body(stats);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public List<SalonDTO> getAllSalons() {
        log.debug("REST request to get all Salons");

        return salonService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<SalonDTO> getSalon(@PathVariable("id") UUID id) {
        log.debug("REST request to get Salon : {}", id);
        return ResponseUtil.wrapOrNotFound(salonService.get(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> deleteSalon(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Salon : {}", id);

        salonService.delete(id);

        return noContent().headers(createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString())).build();
    }
}
