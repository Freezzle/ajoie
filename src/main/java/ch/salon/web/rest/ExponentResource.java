package ch.salon.web.rest;

import static ch.salon.service.ExponentService.ENTITY_NAME;

import ch.salon.domain.Exponent;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.ExponentService;
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

/**
 * REST controller for managing {@link ch.salon.domain.Exponent}.
 */
@RestController
@RequestMapping("/api/exponents")
@Transactional
public class ExponentResource {

    private static final Logger log = LoggerFactory.getLogger(ExponentResource.class);
    private final ExponentService exponentService;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public ExponentResource(ExponentService exponentService) {
        this.exponentService = exponentService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Exponent> createExponent(@Valid @RequestBody Exponent exponent) throws URISyntaxException {
        log.debug("REST request to save Exponent : {}", exponent);

        UUID id = exponentService.create(exponent);

        return ResponseEntity.created(new URI("/api/exponents/" + id))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(exponent);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Exponent> updateExponent(
        @PathVariable(value = "id", required = false) final UUID id,
        @Valid @RequestBody Exponent exponent
    ) throws URISyntaxException {
        log.debug("REST request to update Exponent : {}, {}", id, exponent);

        exponent = exponentService.update(id, exponent);

        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, exponent.getId().toString()))
            .body(exponent);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public List<Exponent> getAllExponents() {
        log.debug("REST request to get all Exponents");

        return exponentService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Exponent> getExponent(@PathVariable("id") UUID id) {
        log.debug("REST request to get Exponent : {}", id);

        return ResponseUtil.wrapOrNotFound(exponentService.get(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> deleteExponent(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Exponent : {}", id);

        exponentService.delete(id);

        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
