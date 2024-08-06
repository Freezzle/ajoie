package ch.salon.service;

import ch.salon.domain.Participation;
import ch.salon.repository.ParticipationRepository;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class ParticipationService {

    public static final String ENTITY_NAME = "participation";

    private final ParticipationRepository participationRepository;

    public ParticipationService(ParticipationRepository participationRepository) {
        this.participationRepository = participationRepository;
    }

    public UUID create(Participation participation) {
        if (participation.getId() != null) {
            throw new BadRequestAlertException("A new participation cannot already have an ID", ENTITY_NAME, "idexists");
        }

        return participationRepository.save(participation).getId();
    }

    public Participation update(final UUID id, Participation participation) {
        if (participation.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, participation.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!participationRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        return participationRepository.save(participation);
    }

    public List<Participation> findAll(String idSalon) {
        if (StringUtils.isNotBlank(idSalon)) {
            return participationRepository.findBySalonId(UUID.fromString(idSalon));
        }

        throw new IllegalStateException("No filter given");
    }

    public Optional<Participation> get(UUID id) {
        return participationRepository.findById(id);
    }

    public void delete(UUID id) {
        participationRepository.deleteById(id);
    }
}
