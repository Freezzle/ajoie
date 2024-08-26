package ch.salon.service;

import ch.salon.domain.Participation;
import ch.salon.domain.Salon;
import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.StandRepository;
import ch.salon.service.dto.SalonDTO;
import ch.salon.service.mapper.PriceStandMapper;
import ch.salon.service.mapper.SalonMapper;
import ch.salon.web.rest.dto.DimensionStats;
import ch.salon.web.rest.dto.SalonStats;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class SalonService {

    public static final String ENTITY_NAME = "salon";

    private final SalonRepository salonRepository;
    private final ParticipationRepository participationRepository;
    private final StandRepository standRepository;

    public SalonService(SalonRepository salonRepository, ParticipationRepository participationRepository, StandRepository standRepository) {
        this.salonRepository = salonRepository;
        this.participationRepository = participationRepository;
        this.standRepository = standRepository;
    }

    public UUID create(SalonDTO salon) {
        if (salon.getId() != null) {
            throw new BadRequestAlertException("A new salon cannot already have an ID", ENTITY_NAME, "idexists");
        }

        return salonRepository.save(SalonMapper.INSTANCE.toEntity(salon)).getId();
    }

    public SalonDTO update(final UUID id, SalonDTO salon) {
        if (salon.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, salon.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        Salon salonFound = salonRepository.getReferenceById(id);

        if (salonFound == null) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        if (salon.getPriceStandSalons() == null || salon.getPriceStandSalons().isEmpty()) {
            salon.setPriceStandSalons(
                salonFound.getPriceStandSalons().stream().map(PriceStandMapper.INSTANCE::toDto).collect(Collectors.toSet())
            );
        }

        return SalonMapper.INSTANCE.toDto(salonRepository.save(SalonMapper.INSTANCE.toEntity(salon)));
    }

    public List<SalonDTO> findAll() {
        return salonRepository.findAll().stream().map(SalonMapper.INSTANCE::toDto).toList();
    }

    public Optional<SalonDTO> get(UUID id) {
        return salonRepository.findById(id).map(SalonMapper.INSTANCE::toDto);
    }

    public void delete(UUID id) {
        salonRepository.deleteById(id);
    }

    public SalonStats getStats(UUID id) {
        List<Participation> participationsSalon = this.participationRepository.findBySalonId(id);

        SalonStats stats = new SalonStats();

        List<Stand> standsAccepted = standRepository
            .findByParticipationId(id)
            .stream()
            .filter(stand -> stand.getStatus() == Status.ACCEPTED)
            .toList();

        stats.setNbStandAccepted(standsAccepted.stream().filter(stand -> stand.getStatus() == Status.ACCEPTED).count());
        stats.setNbStandInVerification(participationsSalon.stream().filter(stand -> stand.getStatus() == Status.IN_VERIFICATION).count());
        stats.setNbStandRefused(participationsSalon.stream().filter(stand -> stand.getStatus() == Status.REFUSED).count());
        stats.setNbStandCanceled(participationsSalon.stream().filter(stand -> stand.getStatus() == Status.CANCELED).count());

        List<Participation> participationsAccepted = participationsSalon
            .stream()
            .filter(participation -> participation.getStatus() == Status.ACCEPTED)
            .toList();

        stats.setNbMealSaturdayMidday(participationsAccepted.stream().map(Participation::getNbMeal1).reduce(0L, Long::sum));
        stats.setNbMealSaturdayEvening(participationsAccepted.stream().map(Participation::getNbMeal2).reduce(0L, Long::sum));
        stats.setNbMealSundayMidday(participationsAccepted.stream().map(Participation::getNbMeal3).reduce(0L, Long::sum));

        stats.setNbParticipationAcceptedPaid(participationsSalon.stream().filter(Participation::getIsBillingClosed).count());
        stats.setNbParticipationAcceptedUnpaid(
            participationsSalon.stream().filter(participation -> !participation.getIsBillingClosed()).count()
        );

        Map<String, Long> dimensions = new HashMap<>();
        for (Stand stand : standsAccepted) {
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

        return stats;
    }
}
