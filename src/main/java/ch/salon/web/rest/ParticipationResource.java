package ch.salon.web.rest;

import ch.salon.domain.Participation;
import ch.salon.repository.ParticipationRepository;
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
 * REST controller for managing {@link ch.salon.domain.Participation}.
 */
@RestController
@RequestMapping("/api/participations")
@Transactional
public class ParticipationResource {

    private static final Logger log = LoggerFactory.getLogger(ParticipationResource.class);

    private static final String ENTITY_NAME = "participation";

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    private final ParticipationRepository participationRepository;

    public ParticipationResource(ParticipationRepository participationRepository) {
        this.participationRepository = participationRepository;
    }

    /**
     * {@code POST  /participations} : Create a new participation.
     *
     * @param participation the participation to create.
     * @return the {@link ResponseEntity} with status {@code 201 (Created)} and with body the new participation, or with status {@code 400 (Bad Request)} if the participation has already an ID.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PostMapping("")
    public ResponseEntity<Participation> createParticipation(@RequestBody Participation participation) throws URISyntaxException {
        log.debug("REST request to save Participation : {}", participation);
        if (participation.getId() != null) {
            throw new BadRequestAlertException("A new participation cannot already have an ID", ENTITY_NAME, "idexists");
        }
        participation = participationRepository.save(participation);
        return ResponseEntity.created(new URI("/api/participations/" + participation.getId()))
            .headers(HeaderUtil.createEntityCreationAlert(applicationName, true, ENTITY_NAME, participation.getId().toString()))
            .body(participation);
    }

    /**
     * {@code PUT  /participations/:id} : Updates an existing participation.
     *
     * @param id the id of the participation to save.
     * @param participation the participation to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated participation,
     * or with status {@code 400 (Bad Request)} if the participation is not valid,
     * or with status {@code 500 (Internal Server Error)} if the participation couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Participation> updateParticipation(
        @PathVariable(value = "id", required = false) final UUID id,
        @RequestBody Participation participation
    ) throws URISyntaxException {
        log.debug("REST request to update Participation : {}, {}", id, participation);
        if (participation.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, participation.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!participationRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        participation = participationRepository.save(participation);
        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, participation.getId().toString()))
            .body(participation);
    }

    /**
     * {@code PATCH  /participations/:id} : Partial updates given fields of an existing participation, field will ignore if it is null
     *
     * @param id the id of the participation to save.
     * @param participation the participation to update.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the updated participation,
     * or with status {@code 400 (Bad Request)} if the participation is not valid,
     * or with status {@code 404 (Not Found)} if the participation is not found,
     * or with status {@code 500 (Internal Server Error)} if the participation couldn't be updated.
     * @throws URISyntaxException if the Location URI syntax is incorrect.
     */
    @PatchMapping(value = "/{id}", consumes = { "application/json", "application/merge-patch+json" })
    public ResponseEntity<Participation> partialUpdateParticipation(
        @PathVariable(value = "id", required = false) final UUID id,
        @RequestBody Participation participation
    ) throws URISyntaxException {
        log.debug("REST request to partial update Participation partially : {}, {}", id, participation);
        if (participation.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, participation.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!participationRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        Optional<Participation> result = participationRepository
            .findById(participation.getId())
            .map(existingParticipation -> {
                if (participation.getRegistrationDate() != null) {
                    existingParticipation.setRegistrationDate(participation.getRegistrationDate());
                }
                if (participation.getNbMeal1() != null) {
                    existingParticipation.setNbMeal1(participation.getNbMeal1());
                }
                if (participation.getNbMeal2() != null) {
                    existingParticipation.setNbMeal2(participation.getNbMeal2());
                }
                if (participation.getNbMeal3() != null) {
                    existingParticipation.setNbMeal3(participation.getNbMeal3());
                }
                if (participation.getAcceptedChart() != null) {
                    existingParticipation.setAcceptedChart(participation.getAcceptedChart());
                }
                if (participation.getAcceptedContract() != null) {
                    existingParticipation.setAcceptedContract(participation.getAcceptedContract());
                }
                if (participation.getNeedArrangment() != null) {
                    existingParticipation.setNeedArrangment(participation.getNeedArrangment());
                }
                if (participation.getIsBillingClosed() != null) {
                    existingParticipation.setIsBillingClosed(participation.getIsBillingClosed());
                }
                if (participation.getStatus() != null) {
                    existingParticipation.setStatus(participation.getStatus());
                }
                if (participation.getExtraInformation() != null) {
                    existingParticipation.setExtraInformation(participation.getExtraInformation());
                }

                return existingParticipation;
            })
            .map(participationRepository::save);

        return ResponseUtil.wrapOrNotFound(
            result,
            HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, participation.getId().toString())
        );
    }

    /**
     * {@code GET  /participations} : get all the participations.
     *
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and the list of participations in body.
     */
    @GetMapping("")
    public List<Participation> getAllParticipations() {
        log.debug("REST request to get all Participations");
        return participationRepository.findAll();
    }

    /**
     * {@code GET  /participations/:id} : get the "id" participation.
     *
     * @param id the id of the participation to retrieve.
     * @return the {@link ResponseEntity} with status {@code 200 (OK)} and with body the participation, or with status {@code 404 (Not Found)}.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Participation> getParticipation(@PathVariable("id") UUID id) {
        log.debug("REST request to get Participation : {}", id);
        Optional<Participation> participation = participationRepository.findById(id);
        return ResponseUtil.wrapOrNotFound(participation);
    }

    /**
     * {@code DELETE  /participations/:id} : delete the "id" participation.
     *
     * @param id the id of the participation to delete.
     * @return the {@link ResponseEntity} with status {@code 204 (NO_CONTENT)}.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteParticipation(@PathVariable("id") UUID id) {
        log.debug("REST request to delete Participation : {}", id);
        participationRepository.deleteById(id);
        return ResponseEntity.noContent()
            .headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .build();
    }
}
