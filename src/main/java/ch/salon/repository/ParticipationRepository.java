package ch.salon.repository;

import ch.salon.domain.Participation;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@SuppressWarnings("unused")
@Repository
public interface ParticipationRepository extends JpaRepository<Participation, UUID> {
    List<Participation> findBySalonIdOrderByRegistrationDateDesc(UUID idSalon);

    @Query("SELECT MAX(p.clientNumber) FROM Participation p where p.salon.id = ?1")
    String findMaxClientNumber(UUID idSalon);

    Participation findByExhibitorEmailAndSalonId(String email, UUID idSalon);
}
