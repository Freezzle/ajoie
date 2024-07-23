package ch.salon.web.rest;

import ch.salon.domain.ConfigurationSalon;
import ch.salon.repository.ConfigurationSalonRepository;
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
 * REST controller for managing {@link ch.salon.domain.ConfigurationSalon}.
 */
@RestController
@RequestMapping("/api/configuration-salons")
@Transactional
public class ConfigurationSalonResource {

    private static final Logger log = LoggerFactory.getLogger(ConfigurationSalonResource.class);

    private static final String ENTITY_NAME = "configurationSalon";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final ConfigurationSalonRepository configurationSalonRepository;

    public ConfigurationSalonResource(ConfigurationSalonRepository configurationSalonRepository) {
        this.configurationSalonRepository = configurationSalonRepository;
    }

    /**
     * {@code POST  /configuration-salons} : Create a new configurationSalon.
     *
     * @param configurationSalon the configurationSalon to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new configurationSalon, or with status {@code 400 (Bad Request)} if the configurationSalon has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<ConfigurationSalon> createConfigurationSalon(@RequestBody ConfigurationSalon configurationSalon)
        throws URISyntaxException {
        log.debug("REST request to save ConfigurationSalon : {}", configurationSalon);
        if (configurationSalon.getId() != null) {
            throw new BadRequestAlertException("A new configurationSalon cannot already have an ID", ENTITY_NAME, "idexists");
        }
        configurationSalon = configurationSalonRepository.save(configurationSalon);
        return ResponseEntity.created(new URI("/api/configuration-salons/" + configurationSalon.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, configurationSalon.getId().toString()))
            .body(configurationSalon);
    }

    /**
     * {@code PUT  /configuration-salons/:id} : Updates an existing configurationSalon.
     *
     * @param id the id of the configurationSalon to save.
     * @param configurationSalon the configurationSalon to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated configurationSalon,
     * or with status {@code 400 (Bad Request)} if the configurationSalon is not valid,
     * or with status {@code 500 (Internal Server Error)} if the configurationSalon couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ConfigurationSalon> updateConfigurationSalon(
        @PathVariable(value = "id", required = false) final UUID id,
        @RequestBody ConfigurationSalon configurationSalon
    ) throws URISyntaxException {
        log.debug("REST request to update ConfigurationSalon : {}, {}", id, configurationSalon);
        if (configurationSalon.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, configurationSalon.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!configurationSalonRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        configurationSalon = configurationSalonRepository.save(configurationSalon);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, configurationSalon.getId().toString()))
            .body(configurationSalon);
    }

    /**
     * {@code PATCH  /configuration-salons/:id} : Partial updates given fields of an existing configurationSalon, field will ignore if it is null
     *
     * @param id the id of the configurationSalon to save.
     * @param configurationSalon the configurationSalon to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated configurationSalon,
     * or with status {@code 400 (Bad Request)} if the configurationSalon is not valid,
     * or with status {@code 404 (Not Found)} if the configurationSalon is not found,
     * or with status {@code 500 (Internal Server Error)} if the configurationSalon couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<ConfigurationSalon> partialUpdateConfigurationSalon(
        @PathVariable(value = "id", required = false) final UUID id,
        @RequestBody ConfigurationSalon configurationSalon
    ) throws URISyntaxException {
        log.debug("REST request to partial update ConfigurationSalon partially : {}, {}", id, configurationSalon);
        if (configurationSalon.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, configurationSalon.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!configurationSalonRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<ConfigurationSalon> result = configurationSalonRepository
            .findById(configurationSalon.getId())
            .map(existingConfigurationSalon -> {
                if (configurationSalon.getPriceMeal1() != null) {
                    existingConfigurationSalon.setPriceMeal1(configurationSalon.getPriceMeal1());
                }
                if (configurationSalon.getPriceMeal2() != null) {
                    existingConfigurationSalon.setPriceMeal2(configurationSalon.getPriceMeal2());
                }
                if (configurationSalon.getPriceMeal3() != null) {
                    existingConfigurationSalon.setPriceMeal3(configurationSalon.getPriceMeal3());
                }
                if (configurationSalon.getPriceConference() != null) {
                    existingConfigurationSalon.setPriceConference(configurationSalon.getPriceConference());
                }
                if (configurationSalon.getPriceSharingStand() != null) {
                    existingConfigurationSalon.setPriceSharingStand(configurationSalon.getPriceSharingStand());
                }

                return existingConfigurationSalon;
            })
            .map(configurationSalonRepository::save);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, configurationSalon.getId().toString())
        );
    }

    /**
     * {@code GET  /configuration-salons} : get all the configurationSalons.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of configurationSalons in body.
     */
    @GetMapping("")
    public List<ConfigurationSalon> getAllConfigurationSalons() {
        log.debug("REST request to get all ConfigurationSalons");
        return configurationSalonRepository.findAll();
    }

    /**
     * {@code GET  /configuration-salons/:id} : get the "id" configurationSalon.
     *
     * @param id the id of the configurationSalon to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the configurationSalon, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ConfigurationSalon> getConfigurationSalon(@PathVariable("id") UUID id) {
        log.debug("REST request to get ConfigurationSalon : {}", id);
        Optional<ConfigurationSalon> configurationSalon = configurationSalonRepository.findById(id);
        return ResponseUtil.wrapOrNotFound(configurationSalon);
    }

    /**
     * {@code DELETE  /configuration-salons/:id} : delete the "id" configurationSalon.
     *
     * @param id the id of the configurationSalon to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConfigurationSalon(@PathVariable("id") UUID id) {
        log.debug("REST request to delete ConfigurationSalon : {}", id);
        configurationSalonRepository.deleteById(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
