package ch.salon.repository;

import ch.salon.domain.WaitlistEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * Accès aux inscriptions de la liste d'attente de la plateforme.
 */
public interface WaitlistEntryRepository extends JpaRepository<WaitlistEntry, UUID> {

    boolean existsByEmail(String email);
}
