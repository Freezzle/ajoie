package ch.salon.service;

import ch.salon.domain.Conference;
import ch.salon.repository.ConferenceRepository;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class ConferenceService {

    public static final String ENTITY_NAME = "conference";

    private final ConferenceRepository conferenceRepository;

    public ConferenceService(ConferenceRepository conferenceRepository) {
        this.conferenceRepository = conferenceRepository;
    }

    public UUID create(Conference conference) {
        if (conference.getId() != null) {
            throw new BadRequestAlertException("A new conference cannot already have an ID", ENTITY_NAME, "idexists");
        }

        return conferenceRepository.save(conference).getId();
    }

    public Conference update(final UUID id, Conference conference) {
        if (conference.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, conference.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!conferenceRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        return conferenceRepository.save(conference);
    }

    public List<Conference> findAll(String idSalon, String idParticipation) {
        if (StringUtils.isNotBlank(idSalon)) {
            return conferenceRepository.findByParticipationSalonId(UUID.fromString(idSalon));
        } else if (StringUtils.isNotBlank(idParticipation)) {
            return conferenceRepository.findByParticipationId(UUID.fromString(idParticipation));
        }

        throw new IllegalStateException("No filter given");
    }

    public Optional<Conference> get(UUID id) {
        return conferenceRepository.findById(id);
    }

    public void delete(UUID id) {
        conferenceRepository.deleteById(id);
    }
}
