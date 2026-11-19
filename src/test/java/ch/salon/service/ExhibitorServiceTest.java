package ch.salon.service;

import ch.salon.domain.Exhibitor;
import ch.salon.repository.ExhibitorRepository;
import ch.salon.repository.ParticipationRepository;
import ch.salon.service.dto.ExhibitorDTO;
import ch.salon.service.mapper.EventLogMapper;
import ch.salon.service.mapper.ExhibitorMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExhibitorServiceTest {

    @Mock
    private ExhibitorRepository exhibitorRepository;

    @Mock
    private ParticipationRepository participationRepository;

    @Mock
    private EventLogService eventLogService;

    @Mock
    private ExhibitorMapper exhibitorMapper;

    @Mock
    private EventLogMapper eventLogMapper;

    @InjectMocks
    private ExhibitorService exhibitorService;

    @Test
    void create_rejectsExistingId() {
        ExhibitorDTO dto = new ExhibitorDTO();
        dto.setId(UUID.randomUUID());

        assertThatThrownBy(() -> exhibitorService.create(dto))
            .isInstanceOf(BadRequestAlertException.class);
    }

    @Test
    void create_rejectsNull() {
        assertThatThrownBy(() -> exhibitorService.create(null))
            .isInstanceOf(BadRequestAlertException.class);
    }

    @Test
    void update_rejectsIdMismatch() {
        ExhibitorDTO dto = new ExhibitorDTO();
        dto.setId(UUID.randomUUID());

        assertThatThrownBy(() -> exhibitorService.update(UUID.randomUUID(), dto))
            .isInstanceOf(BadRequestAlertException.class)
            .hasMessageContaining("Invalid ID");
    }

    @Test
    void update_rejectsMissingEntity() {
        UUID id = UUID.randomUUID();
        ExhibitorDTO dto = new ExhibitorDTO();
        dto.setId(id);

        when(exhibitorRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> exhibitorService.update(id, dto))
            .isInstanceOf(BadRequestAlertException.class);
    }

    @Test
    void patch_setsIdAndDelegatesToUpdate() {
        UUID id = UUID.randomUUID();
        ExhibitorDTO dto = new ExhibitorDTO();

        Exhibitor existing = new Exhibitor();
        existing.setId(id);

        when(exhibitorRepository.findById(id)).thenReturn(Optional.of(existing));
        when(exhibitorMapper.toDto(existing)).thenReturn(new ExhibitorDTO());

        exhibitorService.patch(id, dto);

        assertThat(dto.getId()).isEqualTo(id);
        verify(exhibitorRepository).findById(id);
        verify(exhibitorMapper).updateEntityFromDto(any(ExhibitorDTO.class), any(Exhibitor.class));
    }
}
