package ch.salon.service;

import ch.salon.domain.Participation;
import ch.salon.domain.PriceStandSalon;
import ch.salon.domain.Stand;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.StandRepository;
import ch.salon.service.dto.ParticipationLightDTO;
import ch.salon.service.dto.StandDTO;
import ch.salon.service.mapper.StandMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StandServiceTest {

    @Mock
    private StandRepository standRepository;

    @Mock
    private ParticipationService participationService;

    @Mock
    private EventLogService eventLogService;

    @Mock
    private StandPictureService standPictureService;

    @Mock
    private StandMapper standMapper;

    @InjectMocks
    private StandService standService;

    private UUID participationId;
    private ParticipationLightDTO participationLight;

    @BeforeEach
    void setUp() {
        participationId = UUID.randomUUID();
        participationLight = new ParticipationLightDTO();
        participationLight.setId(participationId);
    }

    @Test
    void create_forcesInVerificationStatusEvenWhenAnotherStatusIsProvided() {
        StandDTO dto = new StandDTO();
        dto.setParticipation(participationLight);
        dto.setStatus(Status.ACCEPTED);

        when(participationService.get(participationId)).thenReturn(Optional.of(new Participation()));

        Stand entity = new Stand();
        Participation linkedParticipation = new Participation();
        linkedParticipation.setId(participationId);
        entity.setParticipation(linkedParticipation);

        when(standMapper.toEntity(dto)).thenReturn(entity);
        when(standRepository.save(any(Stand.class))).thenAnswer(invocation -> invocation.getArgument(0));

        standService.create(dto);

        assertThat(entity.getStatus()).isEqualTo(Status.IN_VERIFICATION);
    }

    @Test
    void create_rejectsExistingId() {
        StandDTO dto = new StandDTO();
        dto.setId(UUID.randomUUID());
        dto.setParticipation(participationLight);

        assertThatThrownBy(() -> standService.create(dto))
            .isInstanceOf(BadRequestAlertException.class);
    }

    @Test
    void create_rejectsMissingParticipation() {
        StandDTO dto = new StandDTO();

        assertThatThrownBy(() -> standService.create(dto))
            .isInstanceOf(BadRequestAlertException.class);
    }

    @Test
    void update_rejectsParticipationChange() {
        UUID standId = UUID.randomUUID();

        StandDTO dto = new StandDTO();
        dto.setId(standId);
        ParticipationLightDTO otherParticipation = new ParticipationLightDTO();
        otherParticipation.setId(UUID.randomUUID());
        dto.setParticipation(otherParticipation);

        Stand existing = new Stand();
        Participation existingParticipation = new Participation();
        existingParticipation.setId(participationId);
        existing.setParticipation(existingParticipation);

        when(standRepository.findById(standId)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> standService.update(standId, dto))
            .isInstanceOf(BadRequestAlertException.class)
            .hasMessageContaining("Participation is immutable");
    }

    @Test
    void update_preservesExistingStatusAndParticipation() {
        UUID standId = UUID.randomUUID();

        StandDTO dto = new StandDTO();
        dto.setId(standId);
        dto.setParticipation(participationLight);

        Participation existingParticipation = new Participation();
        existingParticipation.setId(participationId);

        PriceStandSalon dimension = new PriceStandSalon();
        dimension.setId(UUID.randomUUID());

        Stand existing = new Stand();
        existing.setParticipation(existingParticipation);
        existing.setStatus(Status.VALIDATED);
        existing.setDimension(dimension);
        existing.setShared(Boolean.TRUE);

        Stand mapped = new Stand();
        mapped.setDimension(dimension);
        mapped.setShared(Boolean.TRUE);

        when(standRepository.findById(standId)).thenReturn(Optional.of(existing));
        when(standMapper.toEntity(dto)).thenReturn(mapped);
        when(standMapper.toDto(existing)).thenReturn(new StandDTO());
        lenient().when(standPictureService.getMetadata(any(), any())).thenReturn(Optional.empty());

        standService.update(standId, dto);

        assertThat(existing.getStatus()).isEqualTo(Status.VALIDATED);
        assertThat(existing.getParticipation()).isSameAs(existingParticipation);
    }

    @Test
    void patch_setsIdAndDelegatesToUpdate() {
        UUID standId = UUID.randomUUID();

        StandDTO dto = new StandDTO();
        dto.setParticipation(participationLight);

        Participation existingParticipation = new Participation();
        existingParticipation.setId(participationId);

        PriceStandSalon dimension = new PriceStandSalon();
        dimension.setId(UUID.randomUUID());

        Stand existing = new Stand();
        existing.setParticipation(existingParticipation);
        existing.setStatus(Status.ACCEPTED);
        existing.setDimension(dimension);
        existing.setShared(Boolean.FALSE);

        Stand mapped = new Stand();
        mapped.setDimension(dimension);
        mapped.setShared(Boolean.FALSE);

        when(standRepository.findById(standId)).thenReturn(Optional.of(existing));
        when(standMapper.toEntity(dto)).thenReturn(mapped);
        when(standMapper.toDto(existing)).thenReturn(new StandDTO());
        lenient().when(standPictureService.getMetadata(any(), any())).thenReturn(Optional.empty());

        standService.patch(standId, dto);

        assertThat(dto.getId()).isEqualTo(standId);
        verify(standRepository).findById(standId);
    }
}
