package ch.salon.web.rest;

import ch.salon.domain.Participation;
import ch.salon.domain.PlanningTalksSalon;
import ch.salon.domain.PlanningVolunteerSalon;
import ch.salon.domain.enumeration.Status;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.Importation2026Service;
import ch.salon.service.ParticipationService;
import ch.salon.service.SalonService;
import ch.salon.service.dto.FloorPlanSalonDTO;
import ch.salon.service.dto.ParticipationDTO;
import ch.salon.service.dto.PriceStandDTO;
import ch.salon.service.dto.SalonDTO;
import ch.salon.utils.ResponseUtil;
import ch.salon.utils.ResourceUtil;
import ch.salon.web.rest.dto.InfoInvoice;
import ch.salon.web.rest.dto.SalonStatistiques;
import io.micrometer.common.util.StringUtils;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static ch.salon.service.SalonService.ENTITY_NAME;

@RestController
@RequestMapping("/api/admin/salons")
@Transactional
public class AdminSalonResource {

    private static final Logger log = LoggerFactory.getLogger(AdminSalonResource.class);
    private final SalonService salonService;
    private final Importation2026Service importation2026Service;
    private final ParticipationService participationService;


    public AdminSalonResource(SalonService salonService, Importation2026Service importation2026Service,
                              ParticipationService participationService) {
        this.salonService = salonService;
        this.importation2026Service = importation2026Service;
        this.participationService = participationService;
    }

    @PostMapping("")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<SalonDTO> createSalon(@Valid @RequestBody SalonDTO salon) {
        log.debug("REST request to save Salon : {}", salon);

        UUID id = salonService.create(salon);

        return ResourceUtil.created(ENTITY_NAME, id, "/api/admin/salons").body(salon);
    }

    @PutMapping("/{idSalon}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<SalonDTO> updateSalon(@PathVariable(value = "idSalon", required = false) final UUID idSalon,
                                                @Valid @RequestBody SalonDTO salon) {
        log.debug("REST request to update Salon : {}, {}", idSalon, salon);

        salon = salonService.update(idSalon, salon);

        return ResourceUtil.updated(ENTITY_NAME, idSalon).body(salon);
    }

    @GetMapping("/{idSalon}/participations/info-invoices")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<Map<UUID, InfoInvoice>> getInfoInvoicesForSalon(@PathVariable("idSalon") UUID idSalon) {
        return ResponseEntity.ok(participationService.getInfoInvoicesForSalon(idSalon));
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

        return ResourceUtil.deleted(ENTITY_NAME, idSalon).build();
    }

    @GetMapping("{idSalon}/participations")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<Participation> getAllParticipations(@PathVariable(name = "idSalon", required = false) UUID idSalon) {
        log.debug("REST request to get all Participations");

        return participationService.findAll(idSalon);
    }

    @PostMapping("/{idSalon}/import-inscriptions")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<List<ParticipationDTO>> importation(@PathVariable(name = "idSalon", required = false) String idSalon,
                                                              @RequestParam("file") MultipartFile file) throws URISyntaxException {
        try {
            if (file == null || file.isEmpty() || StringUtils.isEmpty(file.getOriginalFilename())) {
                throw new IllegalArgumentException("No file");
            }

            if (file.getOriginalFilename().contains("2026")) {
                return ResponseEntity.ok(importation2026Service.importData(idSalon, file.getInputStream()));
            } else {
                throw new IllegalStateException("Only 2026 file can be imported");
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{idSalon}/stats")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<SalonStatistiques> getStats(
            @PathVariable(value = "idSalon", required = false) final UUID idSalon,
            @RequestParam List<Status> statuses) {
        log.debug("REST request to get stats from Salon : {}", idSalon);

        SalonStatistiques stats = salonService.getStatistiques(idSalon,
                statuses == null || statuses.isEmpty() ? List.of(Status.CLOSED, Status.VALIDATED, Status.ACCEPTED) :
                        statuses);

        return ResponseEntity.ok().body(stats);
    }

    @GetMapping("/{idSalon}/floor-plan")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<List<FloorPlanSalonDTO>> getFloorPlanSalon(
            @PathVariable(value = "idSalon", required = false) final UUID idSalon) {
        return ResponseEntity.ok(salonService.getFloorPlanSalon(idSalon));
    }

    @PostMapping("/{idSalon}/floor-plan")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<FloorPlanSalonDTO> createFloorPlanSalon(@PathVariable(value = "idSalon") final UUID idSalon,
                                                                  @RequestBody FloorPlanSalonDTO floorPlanSalonDTO) {
        return ResponseEntity.ok(salonService.createFloorPlanSalon(idSalon, floorPlanSalonDTO));
    }

    @DeleteMapping("/{idSalon}/floor-plan/{idFloorPlan}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<FloorPlanSalonDTO> deleteFloorPlanSalon(@PathVariable(value = "idSalon") final UUID idSalon,
                                                                  @PathVariable(value = "idFloorPlan") final UUID idFloorPlan) {
        this.salonService.deleteFloorPlanSalon(idSalon, idFloorPlan);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{idSalon}/floor-plan/{idFloorPlan}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<FloorPlanSalonDTO> updateFloorPlanSalon(@PathVariable(value = "idSalon") final UUID idSalon,
                                                                  @PathVariable(value = "idFloorPlan") final UUID idFloorPlan,
                                                                  @RequestBody FloorPlanSalonDTO floorPlanSalonDTO) {
        return ResponseEntity.ok(salonService.updateFloorPlanSalon(idSalon, idFloorPlan, floorPlanSalonDTO));
    }

    @PutMapping("/{idSalon}/planning-talks")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<PlanningTalksSalon> updatePlanningTalks(
            @PathVariable(value = "idSalon", required = false) final UUID idSalon,
            @RequestBody PlanningTalksSalon planningTalksSalon) {
        return ResponseEntity.ok(salonService.updatePlanningTalks(idSalon, planningTalksSalon));
    }

    @GetMapping("/{idSalon}/planning-talks")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<PlanningTalksSalon> getPlanningTalks(
            @PathVariable(value = "idSalon", required = false) final UUID idSalon) {
        return ResponseEntity.ok(salonService.getPlanningTalks(idSalon));
    }

    @PutMapping("/{idSalon}/planning-volunteers")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<PlanningVolunteerSalon> updatePlanningVolunteers(
            @PathVariable(value = "idSalon", required = false) final UUID idSalon,
            @RequestBody PlanningVolunteerSalon planningVolunteerSalon) {
        return ResponseEntity.ok(salonService.updatePlanningVolunteers(idSalon, planningVolunteerSalon));
    }

    @GetMapping("/{idSalon}/planning-volunteers")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<PlanningVolunteerSalon> getPlanningVolunteers(
            @PathVariable(value = "idSalon", required = false) final UUID idSalon) {
        return ResponseEntity.ok(salonService.getPlanningVolunteers(idSalon));
    }

    @GetMapping("/{idSalon}/dimension-stands")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public ResponseEntity<List<PriceStandDTO>> getDimensionStandsFromSalon(
            @PathVariable(value = "idSalon") final UUID idSalon) {
        return ResponseUtil.wrapOrNotFound(Optional.of(salonService.getDimensionStands(idSalon)));
    }
}
