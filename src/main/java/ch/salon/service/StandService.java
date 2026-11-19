package ch.salon.service;

import ch.salon.domain.Participation;
import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.domain.enumeration.StandPictureType;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.StandRepository;
import ch.salon.service.dto.ImageMetadataDTO;
import ch.salon.service.dto.ParticipationLightDTO;
import ch.salon.service.dto.StandDTO;
import ch.salon.service.mapper.StandMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import static ch.salon.web.rest.errors.ErrorBusinessKey.ID_EXISTS;
import static ch.salon.web.rest.errors.ErrorBusinessKey.OBJ_NULL;
import static ch.salon.web.rest.errors.ErrorBusinessKey.PARTICIPATION_LINK_NULL;
import static ch.salon.web.rest.errors.ErrorBusinessKey.PARTICIPATION_NOTFOUND;

@Service
@AllArgsConstructor
public class StandService {

    public static final String ENTITY_NAME = "stand";

    private final StandRepository standRepository;
    private final ParticipationService participationService;
    private final EventLogService eventLogService;
    private final StandPictureService standPictureService;
    private final StandMapper standMapper;

    public UUID create(StandDTO stand) {
        if (stand == null) {
            throw new BadRequestAlertException("A stand must not be null", ENTITY_NAME, OBJ_NULL);
        }

        if (stand.getId() != null) {
            throw new BadRequestAlertException("A new stand cannot already have an ID", ENTITY_NAME, ID_EXISTS);
        }
        if (stand.getParticipation() == null || stand.getParticipation().getId() == null) {
            throw new BadRequestAlertException("A stand must be attached to a participation", ENTITY_NAME,
                    PARTICIPATION_LINK_NULL);
        }
        if (participationService.get(stand.getParticipation().getId()).isEmpty()) {
            throw new BadRequestAlertException("Participation does not exist", ENTITY_NAME, PARTICIPATION_NOTFOUND);
        }

        Stand entity = standMapper.toEntity(stand);
        entity.setStatus(Status.IN_VERIFICATION);
        entity.setRegistrationDate(Instant.now());
        entity = standRepository.save(entity);

        standPictureService.applyChanges(entity, stand.getPictureUpload(), stand.isRemovePicture(),
                stand.getSharedPictureUpload(), stand.isRemoveSharedPicture());

        this.eventLogService.eventFromSystem("Stand ajouté", EventType.EVENT, EntityType.PARTICIPATION,
                entity.getParticipation().getId(), null);

        return entity.getId();
    }

    public StandDTO update(final UUID id, StandDTO stand) {
        if (stand == null || stand.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        if (!Objects.equals(id, stand.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        Stand standExisting = standRepository.findById(id).orElseThrow(
                () -> new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound"));

        // La participation est définie à la création et ne peut plus changer.
        if (stand.getParticipation() == null || stand.getParticipation().getId() == null
                || !Objects.equals(stand.getParticipation().getId(), standExisting.getParticipation().getId())) {
            throw new BadRequestAlertException("Participation is immutable", ENTITY_NAME, "participationimmutable");
        }

        // Le statut est piloté par les actions métier : il reste inchangé lors d'une mise à jour.
        final Participation existingParticipation = standExisting.getParticipation();
        final Status existingStatus = standExisting.getStatus();

        Stand standToUpdate = standMapper.toEntity(stand);

        if (Stand.diffDimension(standToUpdate, standExisting)) {
            this.eventLogService.eventFromSystem("Un stand a changé de dimension", EventType.EVENT,
                    EntityType.PARTICIPATION, standExisting.getParticipation().getId(),
                    Map.of("old_dimension", standExisting.getDimension().getId().toString(), "new_dimension",
                            standExisting.getDimension().getId().toString()));
        }

        if (Stand.diffShared(standToUpdate, standExisting)) {
            if (standToUpdate.getShared()) {
                this.eventLogService.eventFromSystem("Stand avec co-exposant", EventType.EVENT,
                        EntityType.PARTICIPATION, standExisting.getParticipation().getId(), null);
            } else {
                this.eventLogService.eventFromSystem("Stand sans co-exposant", EventType.EVENT,
                        EntityType.PARTICIPATION, standExisting.getParticipation().getId(), null);
            }
        }

        standMapper.updateEntityFromDto(stand, standExisting);

        // On restaure les champs immuables que le mapper vient d'écraser.
        standExisting.setParticipation(existingParticipation);
        standExisting.setStatus(existingStatus);

        standPictureService.applyChanges(standExisting, stand.getPictureUpload(), stand.isRemovePicture(),
                stand.getSharedPictureUpload(), stand.isRemoveSharedPicture());

        return withPictures(standMapper.toDto(standExisting));
    }

    /**
     * Mise à jour partielle : le formulaire envoie l'état complet des champs éditables, la
     * participation et le statut restent immuables (le statut est piloté par les actions métier).
     */
    public StandDTO patch(final UUID id, StandDTO stand) {
        stand.setId(id);
        return update(id, stand);
    }

    /**
     * Enrichit un DTO avec les métadonnées des images (jamais les octets).
     */
    private StandDTO withPictures(StandDTO dto) {
        standPictureService.getMetadata(dto.getId(), StandPictureType.MAIN).ifPresent(dto::setPicture);
        standPictureService.getMetadata(dto.getId(), StandPictureType.SHARED).ifPresent(dto::setSharedPicture);
        return dto;
    }

    /**
     * Variante groupée : une seule requête pour toute la liste.
     */
    private List<StandDTO> withPictures(List<StandDTO> stands) {
        Map<UUID, Map<StandPictureType, ImageMetadataDTO>> metadata = standPictureService.getMetadataByStandIds(
                stands.stream().map(StandDTO::getId).toList());

        stands.forEach(stand -> {
            Map<StandPictureType, ImageMetadataDTO> byType = metadata.getOrDefault(stand.getId(), Map.of());
            stand.setPicture(byType.get(StandPictureType.MAIN));
            stand.setSharedPicture(byType.get(StandPictureType.SHARED));
        });

        return stands;
    }

    public List<StandDTO> findAll(UUID idSalon, UUID idParticipation) {
        List<StandDTO> stands;
        if (idParticipation != null) {
            stands = standRepository.findByParticipationIdOrderByRegistrationDateDesc(idParticipation).stream()
                                    .map(standMapper::toDto).toList();
        } else if (idSalon != null) {
            stands = standRepository.findByParticipationSalonIdOrderByRegistrationDateDesc(idSalon).stream()
                                    .map(standMapper::toDto).toList();
        } else {
            throw new BadRequestAlertException("A filter is required", ENTITY_NAME, "filter.required");
        }

        return withPictures(stands);
    }

    public Optional<StandDTO> get(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        return standRepository.findById(id).map(standMapper::toDto).map(this::withPictures);
    }

    public void delete(UUID id) {
        if (id == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }

        UUID idParticipation = get(id).map(StandDTO::getParticipation).map(ParticipationLightDTO::getId).orElseThrow();
        standPictureService.deleteAllForStand(id);
        standRepository.deleteById(id);
        this.eventLogService.eventFromSystem("Stand supprimé", EventType.EVENT, EntityType.PARTICIPATION,
                idParticipation, null);
    }
}
