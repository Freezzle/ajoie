package ch.salon.service;

import ch.salon.domain.Exhibitor;
import ch.salon.domain.Participation;
import ch.salon.domain.Salon;
import ch.salon.domain.enumeration.Status;
import ch.salon.repository.*;
import ch.salon.service.mapper.EventLogMapper;
import ch.salon.service.mapper.ParticipationMapper;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ParticipationServiceTest {

    @Mock
    private ParticipationRepository participationRepository;

    @Mock
    private StandRepository standRepository;

    @Mock
    private ConferenceRepository conferenceRepository;

    @Mock
    private WorkshopRepository workshopRepository;

    @Mock
    private EventLogService eventLogService;

    @Mock
    private SalonRepository salonRepository;

    @Mock
    private InvoicingPlanRepository invoicingPlanRepository;

    @Mock
    private ParticipationMapper participationMapper;

    @Mock
    private EventLogMapper eventLogMapper;

    @InjectMocks
    private ParticipationService participationService;

    private UUID exhibitorId;
    private UUID salonId;

    @BeforeEach
    void setUp() {
        exhibitorId = UUID.randomUUID();
        salonId = UUID.randomUUID();
    }

    private Exhibitor exhibitor(UUID id) {
        Exhibitor exhibitor = new Exhibitor();
        exhibitor.setId(id);
        return exhibitor;
    }

    @Test
    void create_forcesInVerificationStatusEvenWhenAnotherStatusIsProvided() {
        Salon salon = new Salon();
        salon.setId(salonId);
        salon.setReferenceNumber("S");

        Participation participation = new Participation();
        participation.setExhibitor(exhibitor(exhibitorId));
        participation.setSalon(salon);
        participation.setStatus(Status.ACCEPTED);

        when(participationRepository.findByExhibitorIdAndSalonId(exhibitorId, salonId)).thenReturn(null);
        when(salonRepository.findById(salonId)).thenReturn(Optional.of(salon));
        when(participationRepository.findMaxClientNumber(salonId)).thenReturn(null);
        when(participationRepository.save(any(Participation.class))).thenAnswer(invocation -> {
            Participation saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        participationService.create(participation);

        assertThat(participation.getStatus()).isEqualTo(Status.IN_VERIFICATION);
    }

    @Test
    void create_rejectsNullParticipation() {
        assertThatThrownBy(() -> participationService.create(null))
            .isInstanceOf(BadRequestAlertException.class);
    }

    @Test
    void create_rejectsExistingId() {
        Participation participation = new Participation();
        participation.setId(UUID.randomUUID());

        assertThatThrownBy(() -> participationService.create(participation))
            .isInstanceOf(BadRequestAlertException.class);
    }

    @Test
    void update_rejectsExhibitorChange() {
        UUID participationId = UUID.randomUUID();

        Participation participation = new Participation();
        participation.setId(participationId);
        participation.setExhibitor(exhibitor(UUID.randomUUID()));

        Participation existing = new Participation();
        existing.setId(participationId);
        existing.setExhibitor(exhibitor(exhibitorId));

        when(participationRepository.findById(participationId)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> participationService.update(participationId, participation))
            .isInstanceOf(BadRequestAlertException.class)
            .hasMessageContaining("Exhibitor is immutable");
    }

    @Test
    void update_rejectsNullExhibitor() {
        UUID participationId = UUID.randomUUID();

        Participation participation = new Participation();
        participation.setId(participationId);

        Participation existing = new Participation();
        existing.setId(participationId);
        existing.setExhibitor(exhibitor(exhibitorId));

        when(participationRepository.findById(participationId)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> participationService.update(participationId, participation))
            .isInstanceOf(BadRequestAlertException.class)
            .hasMessageContaining("Exhibitor is immutable");
    }

    @Test
    void update_preservesExistingStatus() {
        UUID participationId = UUID.randomUUID();

        Participation participation = new Participation();
        participation.setId(participationId);
        participation.setExhibitor(exhibitor(exhibitorId));

        Participation existing = new Participation();
        existing.setId(participationId);
        existing.setExhibitor(exhibitor(exhibitorId));
        existing.setStatus(Status.VALIDATED);
        existing.setClientNumber("SALON-101");

        when(participationRepository.findById(participationId)).thenReturn(Optional.of(existing));
        when(participationRepository.save(any(Participation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        participationService.update(participationId, participation);

        assertThat(participation.getStatus()).isEqualTo(Status.VALIDATED);
        assertThat(participation.getClientNumber()).isEqualTo("SALON-101");
    }

    @Test
    void patch_setsIdAndDelegatesToUpdate() {
        UUID participationId = UUID.randomUUID();

        Participation participation = new Participation();
        participation.setExhibitor(exhibitor(exhibitorId));

        Participation existing = new Participation();
        existing.setId(participationId);
        existing.setExhibitor(exhibitor(exhibitorId));
        existing.setStatus(Status.ACCEPTED);

        when(participationRepository.findById(participationId)).thenReturn(Optional.of(existing));
        when(participationRepository.save(any(Participation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        participationService.patch(participationId, participation);

        assertThat(participation.getId()).isEqualTo(participationId);
        verify(participationRepository).findById(participationId);
    }
}
