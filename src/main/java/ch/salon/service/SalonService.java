package ch.salon.service;

import ch.salon.domain.*;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.*;
import ch.salon.service.dto.FloorPlanSalonDTO;
import ch.salon.service.dto.PriceStandDTO;
import ch.salon.service.dto.SalonDTO;
import ch.salon.service.mapper.FloorPlanSalonMapper;
import ch.salon.service.mapper.PriceStandMapper;
import ch.salon.service.mapper.SalonMapper;
import ch.salon.web.rest.dto.FacturationStats;
import ch.salon.web.rest.dto.SalonStatistiques;
import ch.salon.web.rest.dto.StandInfoStats;
import ch.salon.web.rest.errors.BadRequestAlertException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class SalonService {

    public static final String ENTITY_NAME = "salon";

    private final SalonRepository salonRepository;
    private final ParticipationRepository participationRepository;
    private final StandRepository standRepository;
    private final EventLogService eventLogService;
    private final ConferenceRepository conferenceRepository;
    private final WorkshopRepository workshopRepository;
    private final InvoicingPlanRepository invoicingPlanRepository;
    private final FloorPlanSalonRepository floorPlanSalonRepository;
    private final SalonMapper salonMapper;
    private final FloorPlanSalonMapper  floorPlanSalonMapper;
    private final PriceStandMapper priceStandMapper;
    private final PlanningTalksSalonRepository planningTalksSalonRepository;

    public UUID create(SalonDTO salon) {
        if (salon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (salon.getId() != null) {
            throw new BadRequestAlertException("A new salon cannot already have an ID", ENTITY_NAME, "id.exists");
        }

        return salonRepository.save(salonMapper.toEntity(salon)).getId();
    }

    public SalonDTO update(final UUID id, SalonDTO salon) {
        if (id == null || salon.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, salon.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        Salon salonFound = salonRepository.findById(id).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        if (salon.getPriceStandSalons() == null || salon.getPriceStandSalons().isEmpty()) {
            salon.setPriceStandSalons(salonFound.getPriceStandSalons().stream().map(priceStandMapper::toDto)
                                                .collect(Collectors.toSet()));
        }

        Salon salonToUpdate = salonMapper.toEntity(salon);
        if (Salon.hasDifference(salonFound, salonToUpdate)) {
            participationRepository.findBySalonIdOrderByRegistrationDateDesc(salonFound.getId()).forEach(
                    participation -> eventLogService.eventFromSystem("Attention : Le salon a changé des prix.",
                            EventType.EVENT, EntityType.PARTICIPATION, participation.getId(), null));
        }

        return salonMapper.toDto(salonRepository.save(salonToUpdate));
    }

    public List<SalonDTO> findAll() {
        return salonRepository.findAll().stream().map(salonMapper::toDto).toList();
    }

    public Optional<SalonDTO> get(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return salonRepository.findById(id).map(salonMapper::toDto);
    }

    public void delete(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        salonRepository.deleteById(id);
    }

    public List<PriceStandDTO> getDimensionStands(UUID idSalon) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        Salon salon = this.salonRepository.findById(idSalon).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        return salon.getPriceStandSalons().stream().map(priceStandMapper::toDto).toList();
    }

    public FloorPlanSalonDTO createFloorPlanSalon(UUID idSalon, FloorPlanSalonDTO floorPlanDto) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        FloorPlanSalon floorPlanSalon = new FloorPlanSalon();
        floorPlanSalon.setPosition(floorPlanDto.getPosition());
        floorPlanSalon.setName(floorPlanDto.getName());
        floorPlanSalon.setSalon(this.salonRepository.getReferenceById(idSalon));
        floorPlanSalon.setData(floorPlanDto.getData());

        return floorPlanSalonMapper.toDto(this.floorPlanSalonRepository.save(floorPlanSalon));
    }

    public void deleteFloorPlanSalon(UUID idSalon, UUID idFloorPlan) {
        if (idSalon == null || idFloorPlan == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        FloorPlanSalon floorPlan = this.floorPlanSalonRepository.findById(idFloorPlan).orElseThrow();

        if (!floorPlan.getSalon().getId().equals(idSalon)) {
            throw new BadRequestAlertException("Invalid idSalon", ENTITY_NAME, "doesntMatchs");
        }

        this.floorPlanSalonRepository.delete(floorPlan);
    }

    public FloorPlanSalonDTO updateFloorPlanSalon(UUID idSalon, UUID idFloorPlan, FloorPlanSalonDTO floorPlanSalonDTO) {
        if (idSalon == null || idFloorPlan == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        FloorPlanSalon floorPlan = this.floorPlanSalonRepository.findById(idFloorPlan).orElseThrow();

        if (!floorPlan.getSalon().getId().equals(idSalon)) {
            throw new BadRequestAlertException("Invalid idSalon", ENTITY_NAME, "doesntMatchs");
        }

        floorPlan.setPosition(floorPlanSalonDTO.getPosition());
        floorPlan.setName(floorPlanSalonDTO.getName());
        floorPlan.setData(floorPlanSalonDTO.getData());
        return floorPlanSalonMapper.toDto(this.floorPlanSalonRepository.save(floorPlan));
    }

    public List<FloorPlanSalonDTO> getFloorPlanSalon(UUID idSalon) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return this.floorPlanSalonRepository.findBySalonIdOrderByPosition(idSalon).stream()
                                            .map(floorPlanSalonMapper::toDto).toList();
    }

    public PlanningTalksSalon getPlanningTalks(UUID idSalon) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return this.planningTalksSalonRepository.findBySalonId(idSalon);
    }

    public PlanningTalksSalon updatePlanningTalks(UUID idSalon, PlanningTalksSalon dto) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        var planning = this.getPlanningTalks(idSalon);

        if (planning != null) {
            planning.setConfiguration(dto.getConfiguration());
            planning.setTalks(dto.getTalks());
        } else {
            planning = dto;
            planning.setSalon(this.salonRepository.findById(idSalon).orElseThrow());
        }

        return this.planningTalksSalonRepository.save(planning);
    }

    public SalonStatistiques getStatistiques(UUID idSalon, List<Status> statuses) {
        if (idSalon == null || statuses == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        SalonStatistiques stats = new SalonStatistiques();

        List<Stand> stands =
                standRepository.findByStatusInAndParticipation_SalonId(statuses, idSalon).stream().toList();
        stats.setNbStands(stands.size());
        stats.setNbCoExhibitors(stands.stream().filter(Stand::getShared).toList().size());

        // Dimensions Stand
        Map<String, Long> dimensions = new HashMap<>();
        for (Stand stand : stands) {
            String keyDimension = stand.getDimension() != null ? stand.getDimension().getDimension() : "NONE";
            dimensions.putIfAbsent(keyDimension, 0L);
            dimensions.computeIfPresent(keyDimension, (key, val) -> val + 1);
        }
        stats.setDimensionStands(dimensions);

        // Categories Stand
        Map<String, Long> categories = new HashMap<>();
        for (Stand stand : stands) {
            String keyCategory = stand.getCategory() != null ? stand.getCategory().name() : "NONE";
            categories.putIfAbsent(keyCategory, 0L);
            categories.computeIfPresent(keyCategory, (key, val) -> val + 1);
        }
        stats.setCategoriesStands(categories);

        List<Conference> conferences =
                this.conferenceRepository.findByStatusInAndParticipation_SalonId(statuses, idSalon).stream().toList();
        stats.setNbConference(conferences.size());

        List<Workshop> workshops =
                this.workshopRepository.findByStatusInAndParticipation_SalonId(statuses, idSalon).stream().toList();
        stats.setNbWorkshop(workshops.size());

        List<Participation> participationsSalon =
                this.participationRepository.findBySalonIdAndStatusIn(idSalon, statuses);

        stats.setNbMeal1(
                participationsSalon.stream().map(Participation::getNbMeal1).reduce(Long::sum).orElse(0L).intValue());
        stats.setNbMeal2(
                participationsSalon.stream().map(Participation::getNbMeal2).reduce(Long::sum).orElse(0L).intValue());
        stats.setNbMeal3(
                participationsSalon.stream().map(Participation::getNbMeal3).reduce(Long::sum).orElse(0L).intValue());

        StandInfoStats infoStats = new StandInfoStats();
        infoStats.setNbTable(stands.stream().map(Stand::getNbTable).reduce(Long::sum).orElse(0L));
        infoStats.setNbChair(stands.stream().map(Stand::getNbChair).reduce(Long::sum).orElse(0L));
        infoStats.setNbElectricity(stands.stream().filter(Stand::getNeedElectricity).count());
        infoStats.setNbOffer(participationsSalon.stream().filter(Participation::getHasOffer).count());
        stats.setStandInfo(infoStats);

        stats.setNbCrushOfHeart((int) participationsSalon.stream().filter(Participation::getCrushOfHeart).count());
        stats.setNbGuestOfHonor((int) participationsSalon.stream().filter(Participation::getGuestOfHonor).count());

        Double paid = 0.00;
        Double offered = 0.00;
        Double totalReel = 0.00;
        Double total = 0.00;

        List<InvoicingPlan> invoicingPlans =
                invoicingPlanRepository.findByParticipation_IdInAndParticipation_Salon_IdOrderByBillingNumberDesc(
                        participationsSalon.stream().map(Participation::getId).toList(), idSalon);

        for (InvoicingPlan invoicingPlan : invoicingPlans) {

            if (invoicingPlan == null || invoicingPlan.getState() == State.CANCELLED) {
                continue;
            }

            total += invoicingPlan.getInvoicesDefaultTotal();
            offered += invoicingPlan.getReductionsTotal();
            totalReel += invoicingPlan.getInvoicesTotal();
            paid += invoicingPlan.getPaymentTotal();
        }

        FacturationStats facturationStats = new FacturationStats();
        facturationStats.setTotal(total);
        facturationStats.setDiscount(offered);
        facturationStats.setExpected(totalReel);
        facturationStats.setPaid(paid);
        facturationStats.setRemaining(totalReel - paid);
        stats.setFacturation(facturationStats);

        return stats;
    }
}
