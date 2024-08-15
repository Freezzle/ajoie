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

        if (isAnyOf(standsStatus, conferencesStatus, IN_VERIFICATION)) {
            // If one in verification mode, so participation is still in verification
            participation.setStatus(IN_VERIFICATION);
        } else if (isAnyOf(standsStatus, conferencesStatus, ACCEPTED)) {
            // If one in accepted mode (and none in verification mode due to the previous condition), so participation is accepted
            participation.setStatus(ACCEPTED);
        } else if (isAnyOf(standsStatus, conferencesStatus, REFUSED)) {
            // If one in refused mode (and none in verification/accepted mode due to the previous conditions), so participation is refused
            participation.setStatus(REFUSED);
        } else if (isAllOf(standsStatus, conferencesStatus, CANCELED)) {
            // if none in verification/accepted/refused mode, so participation is canceled
            participation.setStatus(CANCELED);
        }

        participationRepository.save(participation);
    }

    private boolean isAllOf(Set<Status> stands, Set<Status> conferences, Status status) {
        return (
            stands.stream().allMatch(statusStand -> statusStand == status) &&
            conferences.stream().allMatch(statusConf -> statusConf == status)
        );
    }

    private boolean isAnyOf(Set<Status> stands, Set<Status> conferences, Status status) {
        return (
            stands.stream().anyMatch(statusStand -> statusStand == status) ||
            conferences.stream().anyMatch(statusConf -> statusConf == status)
        );
    }

    public Optional<Participation> get(UUID id) {
        return participationRepository.findById(id);
    }

    public void delete(UUID id) {
        participationRepository.deleteById(id);
    }
}
