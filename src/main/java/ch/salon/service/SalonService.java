package ch.salon.service;

import ch.salon.domain.*;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.InvoiceNature;
import ch.salon.domain.enumeration.State;
import ch.salon.domain.enumeration.Status;
import ch.salon.domain.enumeration.Type;
import ch.salon.repository.*;
import ch.salon.service.dto.Aging;
import ch.salon.service.dto.DatedAmount;
import ch.salon.service.dto.DelayStats;
import ch.salon.service.dto.FloorPlanSalonDTO;
import ch.salon.service.dto.FloorPlanBatchRequestDTO;
import ch.salon.service.dto.FloorPlanBatchResponseDTO;
import ch.salon.service.dto.PriceStandDTO;
import ch.salon.service.dto.SalonDashboard;
import ch.salon.service.dto.SalonDTO;
import ch.salon.service.mapper.FloorPlanSalonMapper;
import ch.salon.service.mapper.PriceStandMapper;
import ch.salon.service.mapper.SalonMapper;
import ch.salon.web.rest.dto.FacturationStats;
import ch.salon.web.rest.dto.SalonStatistiques;
import ch.salon.web.rest.dto.StandInfoStats;
import ch.salon.web.rest.errors.BadRequestAlertException;
import ch.salon.web.rest.errors.ConflictAlertException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
    private final FloorPlanSettingsRepository floorPlanSettingsRepository;
    private final SalonSettingsRepository salonSettingsRepository;
    private final FloorPlanMigrator floorPlanMigrator;
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
        return findAll(false);
    }

    /**
     * Salons, enrichis des compteurs affichés dans le pied de la liste.
     *
     * @param includeArchived vrai pour la liste d'administration, qui montre aussi les salons archivés
     */
    public List<SalonDTO> findAll(boolean includeArchived) {
        List<Status> discarded = List.of(Status.REFUSED, Status.CANCELED);

        Map<UUID, Long> participations = toCountBySalon(
                participationRepository.countBySalonExcludingStatuses(discarded));
        Map<UUID, Long> conferences = toCountBySalon(
                conferenceRepository.countBySalonExcludingStatuses(discarded));
        Map<UUID, Long> workshops = toCountBySalon(
                workshopRepository.countBySalonExcludingStatuses(discarded));

        return salonRepository.findAll().stream()
                .filter(s -> includeArchived || !s.isArchived())
                .map(salon -> {
                    SalonDTO dto = salonMapper.toDto(salon);

                    dto.setNbParticipations(participations.getOrDefault(salon.getId(), 0L));
                    dto.setNbConferences(conferences.getOrDefault(salon.getId(), 0L));
                    dto.setNbWorkshops(workshops.getOrDefault(salon.getId(), 0L));

                    return dto;
                })
                .toList();
    }

    private static Map<UUID, Long> toCountBySalon(List<Object[]> rows) {
        Map<UUID, Long> counts = new HashMap<>();

        rows.forEach(row -> {
            if (row[0] != null) {
                counts.put((UUID) row[0], (Long) row[1]);
            }
        });

        return counts;
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
                .map(floorPlanSalonMapper::toDto)
                .peek(dto -> dto.setData(this.floorPlanMigrator.toCurrentFormat(dto.getData())))
                .toList();
    }

    /**
     * Réglages du plan de la salle. Un salon qui n'en a pas encore reçoit les valeurs par
     * défaut, dont la grille reprend le pas des anciens plans quand il y en a un.
     */
    /**
     * Réglages d'un salon partagés par tous les administrateurs. Un salon qui n'en a pas
     * encore reçoit les valeurs par défaut.
     */
    public SalonSettings getSalonSettings(UUID idSalon) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return this.salonSettingsRepository.findBySalonId(idSalon)
                .orElseGet(() -> {
                    SalonSettings settings = new SalonSettings();
                    settings.setData(SalonSettingsData.defaults());
                    return settings;
                });
    }

    /**
     * Enregistre le choix des métriques affichées dans le tableau de bord. La liste est
     * partagée par tous les administrateurs du salon.
     */
    public SalonSettings updateDashboardMetrics(UUID idSalon, List<String> metrics) {
        if (idSalon == null || metrics == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        Salon salon = this.salonRepository.findById(idSalon).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        SalonSettings settings = this.salonSettingsRepository.findBySalonId(idSalon)
                .orElseGet(() -> {
                    SalonSettings created = new SalonSettings();
                    created.setSalon(salon);
                    created.setData(new SalonSettingsData());
                    return created;
                });

        SalonSettingsData data = settings.getData() != null ? settings.getData() : new SalonSettingsData();
        data.setDashboardMetrics(new ArrayList<>(metrics));
        settings.setData(data);

        return this.salonSettingsRepository.save(settings);
    }

    public FloorPlanSettings getFloorPlanSettings(UUID idSalon) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return this.floorPlanSettingsRepository.findBySalonId(idSalon)
                .orElseGet(() -> buildDefaultFloorPlanSettings(idSalon));
    }

    public FloorPlanSettings updateFloorPlanSettings(UUID idSalon, FloorPlanSettingsData data) {
        if (idSalon == null || data == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        Salon salon = this.salonRepository.findById(idSalon).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        FloorPlanSettings settings = this.floorPlanSettingsRepository.findBySalonId(idSalon)
                .orElseGet(() -> {
                    FloorPlanSettings created = new FloorPlanSettings();
                    created.setSalon(salon);
                    return created;
                });
        settings.setData(data);

        return this.floorPlanSettingsRepository.save(settings);
    }

    private FloorPlanSettings buildDefaultFloorPlanSettings(UUID idSalon) {
        FloorPlanSettingsData data = FloorPlanSettingsData.defaults();

        this.floorPlanSalonRepository.findBySalonIdOrderByPosition(idSalon).stream()
                .map(plan -> this.floorPlanMigrator.legacySpacingMeter(plan.getData()))
                .filter(Objects::nonNull)
                .findFirst()
                .ifPresent(data::setGridMeter);

        FloorPlanSettings settings = new FloorPlanSettings();
        settings.setData(data);
        return settings;
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
            // Verrou optimiste : refuse un enregistrement basé sur une version obsolète (ex. une
            // inscription bénévole arrivée pendant l'édition du planning).
            if (dto.getVersion() != null && !dto.getVersion().equals(planning.getVersion())) {
                throw new ConflictAlertException("Le planning a été modifié entre-temps", ENTITY_NAME,
                        "planning-volunteers.conflict");
            }
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

    private static final List<Status> CONFIRMED_STATUSES =
            List.of(Status.ACCEPTED, Status.VALIDATED, Status.CLOSED);

    @org.springframework.transaction.annotation.Transactional
    @SuppressWarnings({"java:S3776", "java:S6541"})
    public SalonDashboard getDashboard(UUID idSalon) {
        if (idSalon == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        Salon salon = salonRepository.findById(idSalon).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        SalonDashboard dashboard = new SalonDashboard();

        List<Status> allStatuses = Arrays.asList(Status.values());

        // All invoicing plans of the salon.
        List<InvoicingPlan> allPlans = invoicingPlanRepository.findByParticipation_Salon_Id(idSalon);
        List<InvoicingPlan> nonCancelledPlans = allPlans.stream()
                .filter(plan -> plan != null && plan.getState() != State.CANCELLED)
                .toList();

        // 9. payments : date + amount of every payment of non-cancelled plans.
        List<DatedAmount> payments = new ArrayList<>();
        for (InvoicingPlan plan : nonCancelledPlans) {
            for (Payment payment : plan.getPayments()) {
                payments.add(new DatedAmount(payment.getBillingDate(), payment.getAmount()));
            }
        }
        dashboard.setPayments(payments);

        // 7.1 statusCounts : count stands / conferences / workshops per status (the 6).
        List<Stand> allStands = standRepository.findByStatusInAndParticipation_SalonId(allStatuses, idSalon);
        List<Conference> allConferences =
                conferenceRepository.findByStatusInAndParticipation_SalonId(allStatuses, idSalon);
        List<Workshop> allWorkshops =
                workshopRepository.findByStatusInAndParticipation_SalonId(allStatuses, idSalon);

        Map<String, Map<Status, Long>> statusCounts = new LinkedHashMap<>();
        statusCounts.put("STAND", countByStatus(allStands.stream().map(Stand::getStatus)));
        statusCounts.put("CONFERENCE", countByStatus(allConferences.stream().map(Conference::getStatus)));
        statusCounts.put("WORKSHOP", countByStatus(allWorkshops.stream().map(Workshop::getStatus)));
        dashboard.setStatusCounts(statusCounts);

        // 7.2 loyalty : over active participations, count distinct exhibitors new vs returning.
        List<Participation> activeParticipations =
                participationRepository.findBySalonIdAndStatusIn(idSalon, Arrays.asList(Status.getActiveStatuses()));
        long loyalReturning = 0;
        long loyalNew = 0;
        Set<UUID> seenExhibitors = new HashSet<>();
        for (Participation participation : activeParticipations) {
            Exhibitor exhibitor = participation.getExhibitor();
            if (exhibitor == null || !seenExhibitors.add(exhibitor.getId())) {
                continue;
            }
            if (isReturningExhibitor(exhibitor.getId(), idSalon, salon.getStartingDate())) {
                loyalReturning++;
            } else {
                loyalNew++;
            }
        }
        dashboard.setLoyalReturning(loyalReturning);
        dashboard.setLoyalNew(loyalNew);

        // Confirmed participations and their non-cancelled plans.
        Set<UUID> confirmedParticipationIds =
                participationRepository.findBySalonIdAndStatusIn(idSalon, CONFIRMED_STATUSES).stream()
                        .map(Participation::getId).collect(Collectors.toSet());
        List<InvoicingPlan> confirmedPlans = nonCancelledPlans.stream()
                .filter(plan -> plan.getParticipation() != null &&
                        confirmedParticipationIds.contains(plan.getParticipation().getId()))
                .toList();

        // 7.5 revenueByService : sum of SERVICE invoice lines of confirmed plans, grouped by type.
        Map<String, Double> revenueByService = new LinkedHashMap<>();
        for (InvoicingPlan plan : confirmedPlans) {
            for (Invoice invoice : plan.getInvoices()) {
                if (invoice.getNature() != InvoiceNature.SERVICE) {
                    continue;
                }
                revenueByService.merge(mapTypeToKey(invoice.getType()), invoice.getTotalAmount(), Double::sum);
            }
        }
        dashboard.setRevenueByService(revenueByService);

        // 7.7 paymentDelay : days between issuedDate and last payment for PAID plans.
        List<Long> paymentDelays = new ArrayList<>();
        for (InvoicingPlan plan : nonCancelledPlans) {
            if (plan.getState() != State.PAID || plan.getIssuedDate() == null) {
                continue;
            }
            Instant lastPayment = plan.getPayments().stream().map(Payment::getBillingDate)
                    .filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null);
            if (lastPayment == null) {
                continue;
            }
            paymentDelays.add(ChronoUnit.DAYS.between(plan.getIssuedDate(), lastPayment));
        }
        dashboard.setPaymentDelay(buildDelayStats(paymentDelays, 10, 31));

        // 7.4 verificationDelay : days between registrationDate and first decision.
        List<Long> verificationDelays = new ArrayList<>();
        List<Participation> allParticipations =
                participationRepository.findBySalonIdAndStatusIn(idSalon, allStatuses);
        for (Participation participation : allParticipations) {
            if (participation.getStatus() == Status.IN_VERIFICATION ||
                    participation.getRegistrationDate() == null) {
                continue;
            }
            Instant decision = firstDecisionDate(participation.getId());
            if (decision == null) {
                continue;
            }
            verificationDelays.add(ChronoUnit.DAYS.between(participation.getRegistrationDate(), decision));
        }
        dashboard.setVerificationDelay(buildDelayStats(verificationDelays, 7, 14, 29));

        // 7.9 billingProgress : classify confirmed non-cancelled plans.
        Map<String, Long> billingProgress = new LinkedHashMap<>();
        billingProgress.put("DRAFT", 0L);
        billingProgress.put("ISSUED", 0L);
        billingProgress.put("PARTIAL", 0L);
        billingProgress.put("PAID", 0L);
        for (InvoicingPlan plan : confirmedPlans) {
            billingProgress.merge(classifyBillingProgress(plan), 1L, Long::sum);
        }
        dashboard.setBillingProgress(billingProgress);

        // 7.10 receivables : remaining amount of issued and not yet paid plans by age.
        Aging receivables = new Aging();
        Instant now = Instant.now();
        for (InvoicingPlan plan : nonCancelledPlans) {
            if (plan.getState() != State.ISSUED && plan.getState() != State.IS_ISSUING) {
                continue;
            }
            double remaining = plan.getInvoicesTotal() - plan.getPaymentTotal();
            if (remaining <= 0) {
                continue;
            }
            Instant expiration = plan.getExpirationDate();
            if (expiration == null || !expiration.isBefore(now)) {
                receivables.setNotDue(receivables.getNotDue() + remaining);
            } else if (ChronoUnit.DAYS.between(expiration, now) < 30) {
                receivables.setOverdueUnder30(receivables.getOverdueUnder30() + remaining);
            } else {
                receivables.setOverdueOver30(receivables.getOverdueOver30() + remaining);
            }
        }
        dashboard.setReceivables(receivables);

        // 7.13 confirmedStandIds and 7.14 confirmedTalkIds.
        dashboard.setConfirmedStandIds(allStands.stream()
                .filter(stand -> CONFIRMED_STATUSES.contains(stand.getStatus()))
                .map(Stand::getId).toList());
        dashboard.setConfirmedTalkIds(Stream.concat(
                allConferences.stream().filter(c -> CONFIRMED_STATUSES.contains(c.getStatus())).map(Conference::getId),
                allWorkshops.stream().filter(w -> CONFIRMED_STATUSES.contains(w.getStatus())).map(Workshop::getId)
        ).toList());

        return dashboard;
    }

    private Map<Status, Long> countByStatus(Stream<Status> statuses) {
        Map<Status, Long> counts = new EnumMap<>(Status.class);
        for (Status status : Status.values()) {
            counts.put(status, 0L);
        }
        statuses.forEach(status -> counts.merge(status, 1L, Long::sum));
        return counts;
    }

    private boolean isReturningExhibitor(UUID exhibitorId, UUID currentSalonId, Instant currentStartingDate) {
        List<Participation> participations =
                participationRepository.findByExhibitorIdOrderByRegistrationDateDesc(exhibitorId);
        for (Participation participation : participations) {
            Salon otherSalon = participation.getSalon();
            if (otherSalon == null || Objects.equals(otherSalon.getId(), currentSalonId)) {
                continue;
            }
            if (!CONFIRMED_STATUSES.contains(participation.getStatus())) {
                continue;
            }
            if (otherSalon.getStartingDate() != null && currentStartingDate != null &&
                    otherSalon.getStartingDate().isBefore(currentStartingDate)) {
                return true;
            }
        }
        return false;
    }

    private String mapTypeToKey(Type type) {
        if (type == null) {
            return "OTHERS";
        }
        return switch (type) {
            case STAND -> "STAND";
            case SHARED -> "SHARED";
            case CONFERENCE -> "CONFERENCE";
            case WORKSHOP -> "WORKSHOP";
            case MEAL1, MEAL2, MEAL3 -> "MEALS";
            case ELECTRICITY -> "ELECTRICITY";
            case POSTAL_FEE -> "POSTAL_FEE";
            case OTHERS -> "OTHERS";
        };
    }

    private Instant firstDecisionDate(UUID participationId) {
        List<EventLog> logs = eventLogService.findAllEventLog(EntityType.PARTICIPATION, participationId);
        for (EventLog log : logs) {
            if (log.getType() == EventType.ACTION && isDecisionLabel(log.getLabel())) {
                return log.getReferenceDate();
            }
        }
        return null;
    }

    private boolean isDecisionLabel(String label) {
        return "Participation acceptée".equals(label) || "Participation annulée".equals(label) ||
                "Participation refusée".equals(label);
    }

    private String classifyBillingProgress(InvoicingPlan plan) {
        State state = plan.getState();
        if (state == State.DRAFT || state == State.ISOLATED) {
            return "DRAFT";
        }
        if (state == State.IS_ISSUING) {
            return "ISSUED";
        }
        if (state == State.ISSUED) {
            double paid = plan.getPaymentTotal();
            if (paid <= 0) {
                return "ISSUED";
            }
            return paid < plan.getInvoicesTotal() ? "PARTIAL" : "PAID";
        }
        return "PAID";
    }

    /**
     * Buckets delays into {@code thresholds.length + 1} ordered counts : index {@code i} holds the
     * number of delays strictly lower than {@code thresholds[i]}, the last index holds the rest.
     */
    private DelayStats buildDelayStats(List<Long> days, long... thresholds) {
        List<Long> buckets = new ArrayList<>(Collections.nCopies(thresholds.length + 1, 0L));
        for (long day : days) {
            int index = thresholds.length;
            for (int i = 0; i < thresholds.length; i++) {
                if (day < thresholds[i]) {
                    index = i;
                    break;
                }
            }
            buckets.set(index, buckets.get(index) + 1);
        }
        DelayStats stats = new DelayStats();
        stats.setMedianDays(median(days));
        stats.setBuckets(buckets);
        return stats;
    }

    private Double median(List<Long> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        List<Long> sorted = values.stream().sorted().toList();
        int size = sorted.size();
        if (size % 2 == 1) {
            return (double) sorted.get(size / 2);
        }
        return (sorted.get(size / 2 - 1) + sorted.get(size / 2)) / 2.0;
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
                newConf.setPlacementIntervalMinutes(srcConf.getPlacementIntervalMinutes());
                if (srcConf.getTalkTypes() != null) {
                    java.util.Map<TalkPlanning.TalkType, TalkTypeConfig> newTalkTypes =
                            new java.util.EnumMap<>(TalkPlanning.TalkType.class);
                    srcConf.getTalkTypes().forEach((type, config) -> {
                        TalkTypeConfig newConfig = new TalkTypeConfig();
                        newConfig.setDurationTalkMinutes(config.getDurationTalkMinutes());
                        newConfig.setPreparationMinutes(config.getPreparationMinutes());
                        newConfig.setCleanupMinutes(config.getCleanupMinutes());
                        newTalkTypes.put(type, newConfig);
                    });
                    newConf.setTalkTypes(newTalkTypes);
                }

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

                    // Les places minimum font partie de la configuration : on les conserve
                    List<VolunteerPlanningNeed> newNeeds = new java.util.ArrayList<>();
                    if (day.getNeeds() != null) {
                        for (VolunteerPlanningNeed need : day.getNeeds()) {
                            VolunteerPlanningNeed newNeed = new VolunteerPlanningNeed();
                            newNeed.setCategoryId(need.getCategoryId());
                            newNeed.setSlotIndex(need.getSlotIndex());
                            newNeed.setMin(need.getMin());
                            newNeeds.add(newNeed);
                        }
                    }
                    newDay.setNeeds(newNeeds);
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
