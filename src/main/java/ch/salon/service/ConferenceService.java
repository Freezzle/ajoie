package ch.salon.service;

import ch.salon.domain.Conference;
import ch.salon.repository.ConferenceRepository;
import ch.salon.service.dto.ConferenceDTO;
import ch.salon.service.dto.ParticipationLightDTO;
import ch.salon.service.mapper.ConferenceMapper;
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
    private final ParticipationService participationService;

    public ConferenceService(ConferenceRepository conferenceRepository, ParticipationService participationService) {
        this.conferenceRepository = conferenceRepository;
        this.participationService = participationService;
    }

    public UUID create(ConferenceDTO conference) {
        if (conference.getId() != null) {
            throw new BadRequestAlertException("A new conference cannot already have an ID", ENTITY_NAME, "idexists");
        }

        Conference conferenceCreated = conferenceRepository.save(ConferenceMapper.INSTANCE.toEntity(conference));

        this.participationService.adaptStatusFromChildren(conferenceCreated.getParticipation().getId());

        return conferenceCreated.getId();
    }

    public ConferenceDTO update(final UUID id, ConferenceDTO conference) {
        if (conference.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, conference.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!conferenceRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        ConferenceDTO conferenceDTO = ConferenceMapper.INSTANCE.toDto(
            conferenceRepository.save(ConferenceMapper.INSTANCE.toEntity(conference))
        );

        this.participationService.adaptStatusFromChildren(conferenceDTO.getParticipation().getId());

        return conferenceDTO;
    }

    public List<ConferenceDTO> findAll(String idSalon, String idParticipation) {
        if (StringUtils.isNotBlank(idParticipation)) {
            return conferenceRepository
                .findByParticipationId(UUID.fromString(idParticipation))
                .stream()
                .map(ConferenceMapper.INSTANCE::toDto)
                .toList();
        } else if (StringUtils.isNotBlank(idSalon)) {
            return conferenceRepository
                .findByParticipationSalonId(UUID.fromString(idSalon))
                .stream()
                .map(ConferenceMapper.INSTANCE::toDto)
                .toList();
        } else {
            throw new IllegalStateException("No filter given");
        }
    }

    public Optional<ConferenceDTO> get(UUID id) {
        return conferenceRepository.findById(id).map(ConferenceMapper.INSTANCE::toDto);
    }

    public void delete(UUID id) {
        UUID idParticipation = get(id).map(ConferenceDTO::getParticipation).map(ParticipationLightDTO::getId).orElseThrow();
        conferenceRepository.deleteById(id);
        this.participationService.adaptStatusFromChildren(idParticipation);
    }
}
