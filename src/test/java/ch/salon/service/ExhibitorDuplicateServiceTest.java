package ch.salon.service;

import ch.salon.domain.Exhibitor;
import ch.salon.domain.Participation;
import ch.salon.domain.Salon;
import ch.salon.domain.enumeration.Status;
import ch.salon.service.dto.DuplicateMergeConflictDTO;
import ch.salon.web.rest.errors.BadRequestAlertException;
import ch.salon.repository.EventLogRepository;
import ch.salon.repository.ExhibitorRepository;
import ch.salon.repository.ParticipationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExhibitorDuplicateServiceTest {

    @Mock
    private ExhibitorRepository exhibitorRepository;
    @Mock
    private ParticipationRepository participationRepository;
    @Mock
    private EventLogRepository eventLogRepository;
    @Mock
    private EventLogService eventLogService;

    @InjectMocks
    private ExhibitorDuplicateService service;

    @Test
    void shouldForceManualDuplicate_whenSameEmailButDifferentNames() {
        Exhibitor existing = exhibitor("Alice", "Martin", "alice@example.com", "0791234567", "fr");

        boolean forced = service.shouldForceManualDuplicate(existing, "Bob", "Durand", "alice@example.com",
                "0791234567", "fr");

        assertThat(forced).isTrue();
    }

    @Test
    void shouldForceManualDuplicate_whenFourIdentityFieldsDiffer() {
        Exhibitor existing = exhibitor("Alice", "Martin", "alice@example.com", "0791234567", "fr");

        boolean forced = service.shouldForceManualDuplicate(existing, "Alicia", "MartinX", "new@example.com",
                "0790000000", "fr");

        assertThat(forced).isTrue();
    }

    @Test
    void findBestDuplicateCandidate_prefersPhoneThenParticipations() {
        Exhibitor a = exhibitor("Marie", "Dubois", "a@example.com", "0791234567", "fr");
        a.setId(UUID.randomUUID());
        Exhibitor b = exhibitor("Marie", "Dubois", "b@example.com", "0791234567", "fr");
        b.setId(UUID.randomUUID());

        when(exhibitorRepository.findAllByPhoneNumberIsEndingWithIgnoreCase("1234567")).thenReturn(List.of(a, b));
        when(exhibitorRepository.findAllByFirstNameContainingIgnoreCaseAndLastNameContainingIgnoreCase("Marie",
                "Dubois")).thenReturn(List.of(a, b));
        when(participationRepository.countByExhibitorId(a.getId())).thenReturn(1L);
        when(participationRepository.countByExhibitorId(b.getId())).thenReturn(3L);

        Optional<Exhibitor> candidate = service.findBestDuplicateCandidate("079 123 45 67", "Marie", "Dubois", null);

        assertThat(candidate).contains(b);
    }

    @Test
    void findMergeConflicts_returnsSalonsWhereBothHaveActiveParticipation() {
        UUID dupId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        Salon shared = salon();
        Salon other = salon();
        when(participationRepository.findByExhibitorIdOrderByRegistrationDateDesc(dupId)).thenReturn(
                List.of(participation(shared, Status.IN_VERIFICATION), participation(other, Status.ACCEPTED)));
        when(participationRepository.findByExhibitorIdOrderByRegistrationDateDesc(targetId)).thenReturn(
                List.of(participation(shared, Status.VALIDATED)));

        List<DuplicateMergeConflictDTO> conflicts = service.findMergeConflicts(dupId, targetId);

        assertThat(conflicts).hasSize(1);
        assertThat(conflicts.get(0).getSalonId()).isEqualTo(shared.getId());
    }

    @Test
    void findMergeConflicts_ignoresCanceledAndRefusedParticipations() {
        UUID dupId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        Salon shared = salon();
        Salon shared2 = salon();
        when(participationRepository.findByExhibitorIdOrderByRegistrationDateDesc(dupId)).thenReturn(
                List.of(participation(shared, Status.CANCELED), participation(shared2, Status.ACCEPTED)));
        when(participationRepository.findByExhibitorIdOrderByRegistrationDateDesc(targetId)).thenReturn(
                List.of(participation(shared, Status.ACCEPTED), participation(shared2, Status.REFUSED)));

        assertThat(service.findMergeConflicts(dupId, targetId)).isEmpty();
    }

    @Test
    void merge_isRefusedWhenConflictsExist() {
        Exhibitor duplicate = exhibitor("A", "B", "a@example.com", null, "fr");
        duplicate.setId(UUID.randomUUID());
        Exhibitor target = exhibitor("A", "B", "a@example.com", null, "fr");
        target.setId(UUID.randomUUID());
        Salon shared = salon();
        when(participationRepository.findByExhibitorIdOrderByRegistrationDateDesc(duplicate.getId())).thenReturn(
                List.of(participation(shared, Status.ACCEPTED)));
        when(participationRepository.findByExhibitorIdOrderByRegistrationDateDesc(target.getId())).thenReturn(
                List.of(participation(shared, Status.ACCEPTED)));

        assertThatThrownBy(() -> service.merge(duplicate, target)).isInstanceOf(BadRequestAlertException.class);
    }

    private Salon salon() {
        Salon salon = new Salon();
        salon.setId(UUID.randomUUID());
        return salon;
    }

    private Participation participation(Salon salon, Status status) {
        Participation participation = new Participation();
        participation.setId(UUID.randomUUID());
        participation.setSalon(salon);
        participation.setStatus(status);
        return participation;
    }

    private Exhibitor exhibitor(String firstName, String lastName, String email, String phone, String language) {
        Exhibitor exhibitor = new Exhibitor();
        exhibitor.setFirstName(firstName);
        exhibitor.setLastName(lastName);
        exhibitor.setEmail(email);
        exhibitor.setPhoneNumber(phone);
        exhibitor.setLanguage(language);
        return exhibitor;
    }
}
