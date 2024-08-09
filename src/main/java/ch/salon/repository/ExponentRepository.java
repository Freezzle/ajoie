package ch.salon.repository;

import ch.salon.domain.Exponent;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Exponent entity.
 */
@SuppressWarnings("unused")
@Repository
public interface ExponentRepository extends JpaRepository<Exponent, UUID> {
    Exponent findByEmail(String email);
}
