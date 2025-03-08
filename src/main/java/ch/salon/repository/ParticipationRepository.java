package ch.salon.repository;

import ch.salon.domain.Participation;
import ch.salon.domain.enumeration.Status;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@SuppressWarnings("unused")
@Repository
public interface ParticipationRepository extends JpaRepository<Participation, UUID> {

    @EntityGraph(attributePaths = {"exhibitor", "exhibitor.billingAddress"})
    List<Participation> findBySalonIdOrderByRegistrationDateDesc(UUID idSalon);

    @EntityGraph(attributePaths = {"exhibitor", "exhibitor.billingAddress"})
    List<Participation> findByExhibitorIdOrderByRegistrationDateDesc(UUID idExhibitor);

    @Query("SELECT MAX(p.clientNumber) FROM Participation p where p.salon.id = ?1")
    String findMaxClientNumber(UUID idSalon);

    Participation findByExhibitorEmailAndSalonId(String email, UUID idSalon);

    @EntityGraph(attributePaths = {"exhibitor", "exhibitor.billingAddress"})
    List<Participation> findBySalonIdAndStatusIn(UUID idSalon, List<Status> statuses);
}
