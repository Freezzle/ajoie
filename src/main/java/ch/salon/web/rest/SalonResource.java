package ch.salon.web.rest;

import static ch.salon.service.SalonService.ENTITY_NAME;
import static org.springframework.http.ResponseEntity.*;
import static tech.jhipster.web.util.HeaderUtil.*;

import ch.salon.domain.Participation;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.ImportationService;
import ch.salon.service.ParticipationService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import tech.jhipster.web.util.ResponseUtil;

@RestController
@RequestMapping("/api/salons")
@Transactional
public class SalonResource {

    private static final Logger log = LoggerFactory.getLogger(SalonResource.class);
    private final SalonService salonService;
    private final ImportationService importationService;
    private final ParticipationService participationService;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public SalonResource(SalonService salonService, ImportationService importationService, ParticipationService participationService) {
        this.salonService = salonService;
        this.importationService = importationService;
        this.participationService = participationService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<SalonDTO> createSalon(@Valid @RequestBody SalonDTO salon) throws URISyntaxException {
        log.debug("REST request to save Salon : {}", salon);

        UUID id = salonService.create(salon);

        return created(new URI("/api/salons/" + id))
            .headers(createEntityCreationAlert(applicationName, true, ENTITY_NAME, id.toString()))
            .body(salon);
    }

    @PutMapping("/{idSalon}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<SalonDTO> updateSalon(
        @PathVariable(value = "idSalon", required = false) final UUID idSalon,
        @Valid @RequestBody SalonDTO salon
    ) {
        log.debug("REST request to update Salon : {}, {}", idSalon, salon);

        salon = salonService.update(idSalon, salon);

        return ok().headers(createEntityUpdateAlert(applicationName, true, ENTITY_NAME, idSalon.toString())).body(salon);
    }

    @GetMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<SalonDTO> getAllSalons() {
        log.debug("REST request to get all Salons");

        return salonService.findAll();
    }

    @GetMapping("/{idSalon}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<SalonDTO> getSalon(@PathVariable("idSalon") UUID idSalon) {
        log.debug("REST request to get Salon : {}", idSalon);
        return ResponseUtil.wrapOrNotFound(salonService.get(idSalon));
    }

    @DeleteMapping("/{idSalon}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Void> deleteSalon(@PathVariable("idSalon") UUID idSalon) {
        log.debug("REST request to delete Salon : {}", idSalon);

        salonService.delete(idSalon);

        return noContent().headers(createEntityDeletionAlert(applicationName, true, ENTITY_NAME, idSalon.toString())).build();
    }

    @GetMapping("{idSalon}/participations")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<Participation> getAllParticipations(@PathVariable(name = "idSalon", required = false) String idSalon) {
        log.debug("REST request to get all Participations");

        return participationService.findAll(idSalon);
    }

    @PostMapping("/{idSalon}/import-inscriptions")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<String> importation(
        @PathVariable(name = "idSalon", required = false) String idSalon,
        @RequestParam("file") MultipartFile file
    ) throws URISyntaxException {
        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("No file");
            }

            importationService.importData(idSalon, file.getInputStream());

            return ResponseEntity.created(new URI("/idSalon/import")).build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Failed to upload the file");
        }
    }

    @GetMapping("/{idSalon}/stats")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<SalonStats> getStats(@PathVariable(value = "idSalon", required = false) final UUID idSalon) {
        log.debug("REST request to get stats from Salon : {}", idSalon);

        SalonStats stats = salonService.getStats(idSalon);

        return ok().headers(createEntityUpdateAlert(applicationName, true, ENTITY_NAME, idSalon.toString())).body(stats);
    }
}
