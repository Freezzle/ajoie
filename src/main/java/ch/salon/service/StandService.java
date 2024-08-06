package ch.salon.service;

import ch.salon.domain.Participation;
import ch.salon.domain.Salon;
import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.StandRepository;
import ch.salon.web.rest.dto.DimensionStats;
import ch.salon.web.rest.dto.SalonStats;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.util.*;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class StandService {

    public static final String ENTITY_NAME = "stand";

    private final StandRepository standRepository;

    public StandService(StandRepository standRepository) {
        this.standRepository = standRepository;
    }

    public UUID create(Stand stand) {
        if (stand.getId() != null) {
            throw new BadRequestAlertException("A new stand cannot already have an ID", ENTITY_NAME, "idexists");
        }

        return standRepository.save(stand).getId();
    }

    public Stand update(final UUID id, Stand stand) {
        if (stand.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, stand.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!standRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        return standRepository.save(stand);
    }

    public List<Stand> findAll(String idSalon, String idParticipation) {
        if (StringUtils.isNotBlank(idSalon)) {
            return standRepository.findByParticipationSalonId(UUID.fromString(idSalon));
        } else if (StringUtils.isNotBlank(idParticipation)) {
            return standRepository.findByParticipationId(UUID.fromString(idParticipation));
        }

        throw new IllegalStateException("No filter given");
    }

    public Optional<Stand> get(UUID id) {
        return standRepository.findById(id);
    }

    public void delete(UUID id) {
        standRepository.deleteById(id);
    }
}
