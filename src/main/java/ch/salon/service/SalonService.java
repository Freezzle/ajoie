package ch.salon.service;

import ch.salon.domain.*;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.State;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.*;
import ch.salon.service.dto.FloorPlanSalonDTO;
import ch.salon.service.dto.FloorPlanBatchRequestDTO;
import ch.salon.service.dto.FloorPlanBatchResponseDTO;
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

import java.util.*;
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
    private final FloorPlanSalonMapper floorPlanSalonMapper;
    private final PriceStandMapper priceStandMapper;
    private final PlanningTalksSalonRepository planningTalksSalonRepository;
    private final PlanningVolunteerSalonRepository planningVolunteerSalonRepository;
    private final TaskInstanceService taskInstanceService;

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


        Salon salonToUpdate = salonMapper.toEntity(salon);
        if (Salon.hasDifference(salonFound, salonToUpdate)) {
            participationRepository.findBySalonIdOrderByRegistrationDateDesc(salonFound.getId()).forEach(
                    participation -> eventLogService.eventFromSystem("Attention : Le salon a changé des prix.",
                            EventType.EVENT, EntityType.PARTICIPATION, participation.getId(), null));
        }

        salonMapper.updateEntityFromDto(salon, salonFound);

        // Gérer les PriceStandSalon pour éviter l'erreur "Detached entity"
        updatePriceStandSalons(salonFound, salon.getPriceStandSalons());

        return salonMapper.toDto(salonFound);
    }

    private void updatePriceStandSalons(Salon salon, Set<PriceStandDTO> priceStandDtos) {
        if (priceStandDtos == null) {
            return;
        }

        // Créer une map des IDs des DTOs reçus
        Map<UUID, PriceStandDTO> dtoMap = priceStandDtos.stream()
                .collect(Collectors.toMap(PriceStandDTO::getId, dto -> dto, (d1, d2) -> d1));

        // Créer une map des IDs existants pour faciliter la mise à jour
        Map<UUID, PriceStandSalon> existingPricesMap = salon.getPriceStandSalons().stream()
                .collect(Collectors.toMap(PriceStandSalon::getId, p -> p));

        // Supprimer les éléments qui ne sont plus présents (orphanRemoval)
        salon.getPriceStandSalons().removeIf(priceStand -> !dtoMap.containsKey(priceStand.getId()));

        // Mettre à jour ou ajouter les PriceStandSalon
        for (PriceStandDTO dto : priceStandDtos) {
            if (dto.getId() != null && existingPricesMap.containsKey(dto.getId())) {
                // Mettre à jour l'entité existante (attachée à la session) via le mapper
                PriceStandSalon priceStand = existingPricesMap.get(dto.getId());
                priceStandMapper.updateEntityFromDto(dto, priceStand);
            } else {
                // Créer une nouvelle entité et l'ajouter à la collection existante
                PriceStandSalon newPriceStand = priceStandMapper.toEntity(dto);
                salon.getPriceStandSalons().add(newPriceStand);
            }
        }
    }

    public List<SalonDTO> findAll() {
        return salonRepository.findAll().stream()
                .filter(s -> !s.isArchived())
                .map(salonMapper::toDto)
                .toList();
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

        Salon salon = salonRepository.findById(id).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));
        salon.setArchived(true);
        salonRepository.save(salon);
    }

    public List<PriceStandDTO> getDimensionStands(UUID idSalon) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        Salon salon = this.salonRepository.findById(idSalon).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        return salon.getPriceStandSalons().stream().map(priceStandMapper::toDto).toList();
    }

    public List<FloorPlanSalonDTO> getFloorPlanSalon(UUID idSalon) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return this.floorPlanSalonRepository.findBySalonIdOrderByPosition(idSalon).stream()
                .map(floorPlanSalonMapper::toDto).toList();
    }

    public FloorPlanBatchResponseDTO batchUpdateFloorPlans(UUID idSalon, FloorPlanBatchRequestDTO request) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        // Valider que le salon existe
        Salon salon = this.salonRepository.findById(idSalon)
                .orElseThrow(() -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        // 1. Supprimer d'abord les FloorPlans à supprimer
        if (request.getIdsToDelete() != null && !request.getIdsToDelete().isEmpty()) {
            for (UUID idFloorPlan : request.getIdsToDelete()) {
                FloorPlanSalon floorPlan = this.floorPlanSalonRepository.findById(idFloorPlan).orElseThrow(
                        () -> new BadRequestAlertException("FloorPlan not found", ENTITY_NAME, "floorplannotfound"));

                // Valider que le FloorPlan appartient bien au salon
                if (!floorPlan.getSalon().getId().equals(idSalon)) {
                    throw new BadRequestAlertException("FloorPlan does not belong to this salon", ENTITY_NAME, "floorplaninvalid");
                }

                this.floorPlanSalonRepository.delete(floorPlan);
            }
        }

        // 2. Créer ou mettre à jour les FloorPlans
        if (request.getFloorPlans() != null && !request.getFloorPlans().isEmpty()) {
            for (FloorPlanSalonDTO dto : request.getFloorPlans()) {
                if (dto.getId() == null) {
                    // Création
                    FloorPlanSalon newFloorPlan = new FloorPlanSalon();
                    newFloorPlan.setPosition(dto.getPosition());
                    newFloorPlan.setName(dto.getName());
                    newFloorPlan.setSalon(salon);
                    newFloorPlan.setData(dto.getData());
                    this.floorPlanSalonRepository.save(newFloorPlan);
                } else {
                    // Mise à jour
                    FloorPlanSalon existingFloorPlan = this.floorPlanSalonRepository.findById(dto.getId()).orElseThrow(
                            () -> new BadRequestAlertException("FloorPlan not found", ENTITY_NAME, "floorplannotfound"));

                    // Valider que le FloorPlan appartient bien au salon
                    if (!existingFloorPlan.getSalon().getId().equals(idSalon)) {
                        throw new BadRequestAlertException("FloorPlan does not belong to this salon", ENTITY_NAME, "floorplaninvalid");
                    }

                    this.floorPlanSalonMapper.updateEntityFromDto(dto, existingFloorPlan);
                }
            }
        }

        // 3. Recharger et retourner la liste complète
        FloorPlanBatchResponseDTO response = new FloorPlanBatchResponseDTO();
        response.setFloorPlans(this.getFloorPlanSalon(idSalon));
        return response;
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

    public PlanningVolunteerSalon getPlanningVolunteers(UUID idSalon) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        PlanningVolunteerSalon planning = this.planningVolunteerSalonRepository.findBySalonId(idSalon);
        if (planning != null && planning.getConfiguration() != null) {
            Integer globalInterval = planning.getConfiguration().getIntervalMinutes();
            if (globalInterval != null) {
                planning.getConfiguration().getDays().forEach(day -> {
                    if (day.getIntervalMinutes() == null) {
                        day.setIntervalMinutes(globalInterval);
                    }
                });
            }
        }
        return planning;
    }

    public PlanningVolunteerSalon updatePlanningVolunteers(UUID idSalon, PlanningVolunteerSalon dto) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        var planning = this.getPlanningVolunteers(idSalon);

        if (planning != null) {
            planning.setConfiguration(dto.getConfiguration());
            planning.setVolunteers(dto.getVolunteers());
        } else {
            planning = dto;
            planning.setSalon(this.salonRepository.findById(idSalon).orElseThrow());
        }

        return this.planningVolunteerSalonRepository.save(planning);
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

    @org.springframework.transaction.annotation.Transactional
    @SuppressWarnings("java:S3776")
    public void duplicateSalon(Salon source, String newPlace, String newReferenceNumber,
                               java.time.Instant startingDate, java.time.Instant endingDate,
                               boolean copyPrices, boolean copyTalksPlanning, boolean copyVolunteerPlanning,
                               boolean copyTasks) {

        Salon newSalon = new Salon();
        newSalon.setPlace(newPlace);
        newSalon.setReferenceNumber(newReferenceNumber);
        newSalon.setStartingDate(startingDate);
        newSalon.setEndingDate(endingDate);
        newSalon.setSourceSalonId(source.getId());

        // Toujours dupliquer les adresses et le compte bancaire
        if (source.getHeadquartersAddress() != null) {
            newSalon.setHeadquartersAddress(copyAddress(source.getHeadquartersAddress()));
        }
        if (source.getEventAddress() != null) {
            newSalon.setEventAddress(copyAddress(source.getEventAddress()));
        }
        if (source.getBankAccount() != null) {
            newSalon.setBankAccount(copyBankAccount(source.getBankAccount()));
        }

        // Dupliquer les prix si demandé
        if (copyPrices) {
            newSalon.setPriceMeal1(source.getPriceMeal1());
            newSalon.setPriceMeal2(source.getPriceMeal2());
            newSalon.setPriceMeal3(source.getPriceMeal3());
            newSalon.setPriceConference(source.getPriceConference());
            newSalon.setPriceWorkshop(source.getPriceWorkshop());
            newSalon.setPriceSharingStand(source.getPriceSharingStand());

            if (source.getPriceStandSalons() != null) {
                java.util.Set<PriceStandSalon> newPrices = new java.util.HashSet<>();
                for (PriceStandSalon pss : source.getPriceStandSalons()) {
                    PriceStandSalon newPss = new PriceStandSalon();
                    newPss.setPrice(pss.getPrice());
                    newPss.setDimension(pss.getDimension());
                    newPss.setWidthMeter(pss.getWidthMeter());
                    newPss.setHeightMeter(pss.getHeightMeter());
                    newPss.setNbSellingSide(pss.getNbSellingSide());
                    newPrices.add(newPss);
                }
                newSalon.setPriceStandSalons(newPrices);
            }
        }

        Salon savedSalon = salonRepository.save(newSalon);

        // Dupliquer la configuration du planning des animations si demandé
        if (copyTalksPlanning) {
            PlanningTalksSalon sourceTalks = planningTalksSalonRepository.findBySalonId(source.getId());
            if (sourceTalks != null && sourceTalks.getConfiguration() != null) {
                PlanningTalksSalon newTalks = new PlanningTalksSalon();
                newTalks.setSalon(savedSalon);
                // Copie profonde de la configuration (jours, salles, plages horaires) mais sans les animations
                TimelineData srcConf = sourceTalks.getConfiguration();
                TimelineData newConf = new TimelineData();
                newConf.setEventId(srcConf.getEventId());
                newConf.setIntervalMinutes(srcConf.getIntervalMinutes());

                List<TimelineRoom> newRooms = new java.util.ArrayList<>();
                for (TimelineRoom room : srcConf.getRooms()) {
                    TimelineRoom newRoom = new TimelineRoom();
                    newRoom.setId(room.getId());
                    newRoom.setLabel(room.getLabel());
                    newRooms.add(newRoom);
                }
                newConf.setRooms(newRooms);

                List<TimelineDay> newDays = new java.util.ArrayList<>();
                for (TimelineDay day : srcConf.getDays()) {
                    TimelineDay newDay = new TimelineDay();
                    newDay.setId(day.getId());
                    newDay.setLabel(day.getLabel());
                    List<TimelineRoomData> newRoomDataList = new java.util.ArrayList<>();
                    for (TimelineRoomData rd : day.getRooms()) {
                        TimelineRoomData newRd = new TimelineRoomData();
                        newRd.setRoomId(rd.getRoomId());
                        newRd.setStartingHour(rd.getStartingHour());
                        newRd.setEndingHour(rd.getEndingHour());
                        newRoomDataList.add(newRd);
                    }
                    newDay.setRooms(newRoomDataList);
                    newDays.add(newDay);
                }
                newConf.setDays(newDays);
                newTalks.setConfiguration(newConf);
                newTalks.setTalks(new java.util.ArrayList<>());
                planningTalksSalonRepository.save(newTalks);
            }
        }

        // Dupliquer la configuration du planning des bénévoles si demandé
        if (copyVolunteerPlanning) {
            PlanningVolunteerSalon sourceVol = planningVolunteerSalonRepository.findBySalonId(source.getId());
            if (sourceVol != null && sourceVol.getConfiguration() != null) {
                PlanningVolunteerSalon newVol = new PlanningVolunteerSalon();
                newVol.setSalon(savedSalon);

                VolunteerPlanningConfiguration srcConf = sourceVol.getConfiguration();
                VolunteerPlanningConfiguration newConf = new VolunteerPlanningConfiguration();
                newConf.setIntervalMinutes(srcConf.getIntervalMinutes());

                // Copier les catégories (rôles)
                List<VolunteerPlanningCategory> newCategories = new java.util.ArrayList<>();
                for (VolunteerPlanningCategory cat : srcConf.getCategories()) {
                    VolunteerPlanningCategory newCat = new VolunteerPlanningCategory();
                    newCat.setId(cat.getId());
                    newCat.setLabel(cat.getLabel());
                    newCat.setIcon(cat.getIcon());
                    newCat.setColor(cat.getColor());
                    newCategories.add(newCat);
                }
                newConf.setCategories(newCategories);

                // Copier les jours avec plages horaires et bénévoles assignés, mais sans les affectations
                List<VolunteerPlanningDay> newDays = new java.util.ArrayList<>();
                for (VolunteerPlanningDay day : srcConf.getDays()) {
                    VolunteerPlanningDay newDay = new VolunteerPlanningDay();
                    newDay.setId(day.getId());
                    newDay.setLabel(day.getLabel());
                    newDay.setStartTime(day.getStartTime());
                    newDay.setEndTime(day.getEndTime());
                    newDay.setIntervalMinutes(day.getIntervalMinutes());
                    newDay.setAssignedVolunteerIds(new java.util.ArrayList<>(day.getAssignedVolunteerIds()));
                    newDay.setCells(new java.util.ArrayList<>());
                    newDay.setUnavailableCells(new java.util.ArrayList<>());
                    newDays.add(newDay);
                }
                newConf.setDays(newDays);
                newVol.setConfiguration(newConf);

                // Copier la liste des bénévoles
                List<VolunteerPlanningData> newVolunteers = new java.util.ArrayList<>();
                if (sourceVol.getVolunteers() != null) {
                    for (VolunteerPlanningData vol : sourceVol.getVolunteers()) {
                        VolunteerPlanningData newVolData = new VolunteerPlanningData();
                        newVolData.setId(vol.getId());
                        newVolData.setLabel(vol.getLabel());
                        newVolunteers.add(newVolData);
                    }
                }
                newVol.setVolunteers(newVolunteers);
                planningVolunteerSalonRepository.save(newVol);
            }
        }

        // Copier les tâches récurrentes si demandé
        if (copyTasks) {
            taskInstanceService.copyRecurringTasksFromSalon(savedSalon.getId(), source.getId());
        }
    }

    private Address copyAddress(Address source) {
        Address copy = new Address();
        copy.setFormalLine(source.getFormalLine());
        copy.setFullName(source.getFullName());
        copy.setPostalCase(source.getPostalCase());
        copy.setStreet(source.getStreet());
        copy.setHouseNumber(source.getHouseNumber());
        copy.setPostalCode(source.getPostalCode());
        copy.setCity(source.getCity());
        copy.setIsoCountry(source.getIsoCountry());
        copy.setExtraLine(source.getExtraLine());
        return copy;
    }

    private BankAccount copyBankAccount(BankAccount source) {
        BankAccount copy = new BankAccount();
        copy.setIban(source.getIban());
        copy.setAccountHolder(source.getAccountHolder());
        copy.setBic(source.getBic());
        return copy;
    }
}
