package ch.salon.repository;

import ch.salon.domain.Exhibitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Spring Data JPA repository for the Exhibitor entity.
 */
@SuppressWarnings("unused")
@Repository
public interface ExhibitorRepository extends JpaRepository<Exhibitor, UUID> {
    Exhibitor findByEmail(String email);
}
