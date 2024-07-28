package ch.salon.web.rest;

import ch.salon.domain.DimensionStand;
import ch.salon.domain.Salon;
import ch.salon.domain.Stand;
import ch.salon.domain.StandStatus;
import ch.salon.repository.DimensionStandRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.StandRepository;
import ch.salon.web.rest.dto.DimensionStats;
import ch.salon.web.rest.dto.SalonStats;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import org.apache.commons.lang3.StringUtils;
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

    private final StandRepository standRepository;

    private final DimensionStandRepository dimensionStandRepository;

    public SalonResource(
        SalonRepository salonRepository,
        StandRepository standRepository,
        DimensionStandRepository dimensionStandRepository
    ) {
        this.salonRepository = salonRepository;
        this.standRepository = standRepository;
        this.dimensionStandRepository = dimensionStandRepository;
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

    @GetMapping("/{id}/stats")
    public ResponseEntity<SalonStats> statsSalon(@PathVariable(value = "id", required = false) final UUID id) {
        log.debug("REST request to get stats from Salon : {}", id);

        List<Stand> allStands = this.standRepository.findAllStandsBySalon_Id(id);

        SalonStats stats = new SalonStats();
        List<Stand> standsValidated = allStands.stream().filter(stand -> stand.getStatus() == StandStatus.VALIDATED).toList();

        stats.setNbStandValidated(standsValidated.stream().filter(stand -> stand.getStatus() == StandStatus.VALIDATED).count());
        stats.setNbStandIntreatment(allStands.stream().filter(stand -> stand.getStatus() == StandStatus.IN_TREATMENT).count());
        stats.setNbStandRefused(allStands.stream().filter(stand -> stand.getStatus() == StandStatus.REFUSED).count());

        stats.setNbMealSaturdayMidday(standsValidated.stream().map(Stand::getNbMeal1).reduce(0L, Long::sum));
        stats.setNbMealSaturdayEvening(standsValidated.stream().map(Stand::getNbMeal2).reduce(0L, Long::sum));
        stats.setNbMealSundayMidday(standsValidated.stream().map(Stand::getNbMeal3).reduce(0L, Long::sum));

        stats.setNbStandValidatedPaid(standsValidated.stream().filter(Stand::getBillingClosed).count());
        stats.setNbStandValidatedUnpaid(standsValidated.stream().filter(stand -> !stand.getBillingClosed()).count());

        Map<String, Long> dimensions = new HashMap<>();
        for (Stand stand : standsValidated) {
            if (stand.getDimension() != null) {
                String keyDimension = stand.getDimension().getDimension();

                if (StringUtils.isNotBlank(keyDimension)) {
                    dimensions.putIfAbsent(keyDimension, 0L);
                    dimensions.computeIfPresent(keyDimension, (key, val) -> val + 1);
                } else {
                    dimensions.putIfAbsent("Unknown", 0L);
                    dimensions.computeIfPresent("Unknown", (key, val) -> val + 1);
                }
            } else {
                dimensions.putIfAbsent("Not_Affected", 0L);
                dimensions.computeIfPresent("Not_Affected", (key, val) -> val + 1);
            }
        }

        for (Map.Entry<String, Long> entry : dimensions.entrySet()) {
            stats.getDimensionStats().add(new DimensionStats(entry.getKey(), entry.getValue()));
        }

        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(stats);
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
