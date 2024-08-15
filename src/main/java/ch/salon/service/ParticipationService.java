package ch.salon.service;

import static ch.salon.domain.enumeration.Status.*;

import ch.salon.domain.Conference;
import ch.salon.domain.Participation;
import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.ConferenceRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.StandRepository;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class ParticipationService {

    public static final String ENTITY_NAME = "participation";

    private final ParticipationRepository participationRepository;

    private final StandRepository standRepository;
    private final ConferenceRepository conferenceRepository;

    public ParticipationService(
        ParticipationRepository participationRepository,
        ConferenceRepository conferenceRepository,
        StandRepository standRepository
    ) {
        this.participationRepository = participationRepository;
        this.conferenceRepository = conferenceRepository;
        this.standRepository = standRepository;
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

    public void adaptStatusFromChildren(UUID idParticipation) {
        Participation participation = participationRepository.getReferenceById(idParticipation);
        if (participation == null) {
            throw new IllegalStateException("No participation found");
        }
        List<Stand> stands = this.standRepository.findByParticipationId(idParticipation);
        Set<Status> standsStatus = stands.stream().map(Stand::getStatus).collect(Collectors.toSet());
        List<Conference> conferences = this.conferenceRepository.findByParticipationId(idParticipation);
        Set<Status> conferencesStatus = conferences.stream().map(Conference::getStatus).collect(Collectors.toSet());

        if (
            standsStatus.stream().anyMatch(status -> status == IN_VERIFICATION) ||
            conferencesStatus.stream().anyMatch(status -> status == IN_VERIFICATION)
        ) {
            // If one in verification mode, so we set the status in verification mode for the participation
            participation.setStatus(IN_VERIFICATION);
        } else if (
            standsStatus.stream().anyMatch(status -> status == ACCEPTED) ||
            conferencesStatus.stream().anyMatch(status -> status == ACCEPTED)
        ) {
            // If one accepted mode (and no one in verification due to the previous condition), so we set the status accepted mode for the participation
            participation.setStatus(ACCEPTED);
        } else if (
            standsStatus.stream().anyMatch(status -> status == REFUSED) || conferencesStatus.stream().anyMatch(status -> status == REFUSED)
        ) {
            // If one accepted mode (and no one in verification or accepted due to the previous condition), so we set the status refused mode for the participation
            participation.setStatus(REFUSED);
        } else if (
            standsStatus.stream().allMatch(status -> status == CANCELED) &&
            conferencesStatus.stream().allMatch(status -> status == CANCELED)
        ) {
            // If one accepted mode (and no one in verification or accepted due to the previous condition), so we set the status refused mode for the participation
            participation.setStatus(CANCELED);
        }

        participationRepository.save(participation);
    }

    public Optional<Participation> get(UUID id) {
        return participationRepository.findById(id);
    }

    public void delete(UUID id) {
        participationRepository.deleteById(id);
    }
}
