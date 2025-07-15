package ch.salon.service;

import ch.salon.domain.Conference;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.repository.ConferenceRepository;
import ch.salon.service.dto.ConferenceDTO;
import ch.salon.service.dto.ParticipationLightDTO;
import ch.salon.service.mapper.ConferenceMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import static ch.salon.web.rest.errors.ErrorBusinessKey.ENTITY_NOTFOUND;
import static ch.salon.web.rest.errors.ErrorBusinessKey.ID_EXISTS;
import static ch.salon.web.rest.errors.ErrorBusinessKey.ID_INVALID;
import static ch.salon.web.rest.errors.ErrorBusinessKey.ID_NULL;
import static ch.salon.web.rest.errors.ErrorBusinessKey.OBJ_NULL;
import static ch.salon.web.rest.errors.ErrorBusinessKey.PARTICIPATION_LINK_NULL;
import static ch.salon.web.rest.errors.ErrorBusinessKey.PARTICIPATION_NOTFOUND;

@Service
public class ConferenceService {

    public static final String ENTITY_NAME = "conference";

    private final ConferenceRepository conferenceRepository;
    private final ParticipationService participationService;
    private final EventLogService eventLogService;

    public ConferenceService(ConferenceRepository conferenceRepository, ParticipationService participationService,
            EventLogService eventLogService) {
        this.conferenceRepository = conferenceRepository;
        this.participationService = participationService;
        this.eventLogService = eventLogService;
    }

    public UUID create(ConferenceDTO conference) {
        if (conference == null) {
            throw new BadRequestAlertException("A new conference must not be null", ENTITY_NAME, OBJ_NULL);
        }

        if (conference.getId() != null) {
            throw new BadRequestAlertException("A new conference cannot already have an ID", ENTITY_NAME, ID_EXISTS);
        }

        if (conference.getParticipation() == null || conference.getParticipation().getId() == null) {
            throw new BadRequestAlertException("A new conference must be attached to a participation", ENTITY_NAME,
                    PARTICIPATION_LINK_NULL);
        }

        if (participationService.get(conference.getParticipation().getId()).isEmpty()) {
            throw new BadRequestAlertException("Participation does not exist", ENTITY_NAME, PARTICIPATION_NOTFOUND);
        }

        Conference entity = ConferenceMapper.INSTANCE.toEntity(conference);
        entity.setRegistrationDate(Instant.now());
        entity = conferenceRepository.save(entity);

        this.eventLogService.eventFromSystem("Une conférence a été ajoutée", EventType.EVENT, EntityType.PARTICIPATION,
                entity.getParticipation().getId(), null);

        this.participationService.adaptStatusFromChildren(entity.getParticipation().getId());

        return entity.getId();
    }

    public ConferenceDTO update(final UUID id, ConferenceDTO conference) {
        if (conference == null) {
            throw new BadRequestAlertException("A conference must not be null", ENTITY_NAME, OBJ_NULL);
        }

        if (id == null || conference.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, ID_NULL);
        }

        if (!Objects.equals(id, conference.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, ID_INVALID);
        }

        Conference conferenceExisting = this.conferenceRepository.findById(id).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, ENTITY_NOTFOUND));

        Conference conferenceToUpdate = ConferenceMapper.INSTANCE.toEntity(conference);

        if (Conference.diffStatus(conferenceToUpdate, conferenceExisting)) {
            this.eventLogService.eventFromSystem(
                    "Le statut d'une conférence a changé en '" + conferenceToUpdate.getStatus().name().toLowerCase() +
                            "'", EventType.EVENT, EntityType.PARTICIPATION,
                    conferenceExisting.getParticipation().getId(),
                    Map.of("old_status", conferenceExisting.getStatus().name()));
        }

        conferenceToUpdate.setRegistrationDate(conferenceExisting.getRegistrationDate());
        conferenceToUpdate = conferenceRepository.save(conferenceToUpdate);

        this.participationService.adaptStatusFromChildren(conferenceToUpdate.getParticipation().getId());

        return ConferenceMapper.INSTANCE.toDto(conferenceToUpdate);
    }

    public List<ConferenceDTO> findAll(UUID idSalon, UUID idParticipation) {
        if (idParticipation != null) {
            return conferenceRepository.findByParticipationIdOrderByRegistrationDateDesc(idParticipation).stream()
                                       .map(ConferenceMapper.INSTANCE::toDto).toList();
        } else if (idSalon != null) {
            return conferenceRepository.findByParticipationSalonIdOrderByRegistrationDateDesc(idSalon).stream()
                                       .map(ConferenceMapper.INSTANCE::toDto).toList();
        } else {
            throw new IllegalStateException("No filter given");
        }
    }

    public Optional<ConferenceDTO> get(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Id null", ENTITY_NAME, ID_NULL);
        }

        return conferenceRepository.findById(id).map(ConferenceMapper.INSTANCE::toDto);
    }

    public void delete(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Id null", ENTITY_NAME, ID_NULL);
        }

        UUID idParticipation =
                get(id).map(ConferenceDTO::getParticipation).map(ParticipationLightDTO::getId).orElseThrow();

        conferenceRepository.deleteById(id);
        this.eventLogService.eventFromSystem("Une conférence a été supprimée.", EventType.EVENT,
                EntityType.PARTICIPATION, idParticipation, null);
        this.participationService.adaptStatusFromChildren(idParticipation);
    }
}
