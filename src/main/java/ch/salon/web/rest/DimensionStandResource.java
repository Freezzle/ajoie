package ch.salon.web.rest;

import static ch.salon.service.DimensionStandService.ENTITY_NAME;

import ch.salon.domain.DimensionStand;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.DimensionStandService;
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
@RequestMapping("/api/dimension-stands")
@Transactional
public class DimensionStandResource {

    private static final Logger log = LoggerFactory.getLogger(DimensionStandResource.class);
    private final DimensionStandService dimensionStandService;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public DimensionStandResource(DimensionStandService dimensionStandService) {
        this.dimensionStandService = dimensionStandService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<DimensionStand> createDimensionStand(@Valid @RequestBody DimensionStand dimensionStand)
        throws URISyntaxException {
        log.debug("REST request to save DimensionStand : {}", dimensionStand);

        UUID id = dimensionStandService.create(dimensionStand);

        return ResponseEntity.created(new URI("/api/dimension-stands/" + id))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(dimensionStand);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
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
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public List<DimensionStand> getAllDimensionStands() {
        log.debug("REST request to get all DimensionStands");

        return dimensionStandService.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<DimensionStand> getDimensionStand(@PathVariable("id") UUID id) {
        log.debug("REST request to get DimensionStand : {}", id);

        return ResponseUtil.wrapOrNotFound(dimensionStandService.get(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> deleteDimensionStand(@PathVariable("id") UUID id) {
        log.debug("REST request to delete DimensionStand : {}", id);

        dimensionStandService.delete(id);

        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
