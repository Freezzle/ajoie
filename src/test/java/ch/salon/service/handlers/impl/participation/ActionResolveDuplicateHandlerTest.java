package ch.salon.service.handlers.impl.participation;

import ch.salon.domain.Exhibitor;
import ch.salon.domain.Participation;
import ch.salon.service.ExhibitorDuplicateService;
import ch.salon.service.duplicate.DuplicateDecision;
import ch.salon.web.rest.errors.BadRequestAlertException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ActionResolveDuplicateHandlerTest {

    @Mock
    private ExhibitorDuplicateService exhibitorDuplicateService;

    @InjectMocks
    private ActionResolveDuplicateHandler handler;

    @Test
    void supports_rejectedWhenNoDuplicate() {
        Participation participation = participation(false);

        assertThat(handler.supports(participation, Map.of()).isRejected()).isTrue();
    }

    @Test
    void supports_allowedWhenDuplicateDetected() {
        Participation participation = participation(true);

        assertThat(handler.supports(participation, Map.of()).isAllowed()).isTrue();
    }

    @Test
    void execute_rejectsMergeWithoutTarget() {
        Participation participation = participation(true);

        assertThatThrownBy(() -> handler.execute(participation, Map.of("decision", "MERGE")))
                .isInstanceOf(BadRequestAlertException.class);
    }

    @Test
    void execute_delegatesToService() {
        Participation participation = participation(true);
        UUID targetId = UUID.randomUUID();

        handler.execute(participation, Map.of("decision", "KEEP_SEPARATE", "targetExhibitorId", targetId.toString()));

        verify(exhibitorDuplicateService).resolveForParticipation(participation, DuplicateDecision.KEEP_SEPARATE,
                targetId);
    }

    private Participation participation(boolean duplicateDetected) {
        Exhibitor exhibitor = new Exhibitor();
        exhibitor.setId(UUID.randomUUID());
        exhibitor.setDuplicateDetected(duplicateDetected);

        Participation participation = new Participation();
        participation.setId(UUID.randomUUID());
        participation.setExhibitor(exhibitor);
        return participation;
    }
}
