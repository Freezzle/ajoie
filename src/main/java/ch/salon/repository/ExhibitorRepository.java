package ch.salon.repository;

import ch.salon.domain.Exhibitor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExhibitorRepository extends JpaRepository<Exhibitor, UUID> {

    @EntityGraph(attributePaths = {"billingAddress"})
    List<Exhibitor> findByOrderByRegistrationDateDesc();

    List<Exhibitor> findAllByPhoneNumberIsEndingWithIgnoreCase(String phoneNumber);

    List<Exhibitor> findAllByFirstNameContainingIgnoreCaseAndLastNameContainingIgnoreCase(String firstName,
            String lastName);

    List<Exhibitor> findAllByEmailOrderByDuplicateDetectedAscRegistrationDateAsc(String email);

    /** Fiche de référence pour un e-mail : celle qui n'est pas marquée doublon, puis la plus ancienne. */
    default Exhibitor findByEmail(String email) {
        return findAllByEmailOrderByDuplicateDetectedAscRegistrationDateAsc(email).stream().findFirst().orElse(null);
    }

    List<Exhibitor> findAllByNewsletterIsTrueAndRedFlagIsFalse();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Exhibitor e SET e.duplicateOfId = :targetId WHERE e.duplicateOfId = :duplicateId")
    int redirectDuplicateReferences(@Param("duplicateId") UUID duplicateId, @Param("targetId") UUID targetId);
}
