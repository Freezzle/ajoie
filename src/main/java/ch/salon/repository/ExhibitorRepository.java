package ch.salon.repository;

import ch.salon.domain.Exhibitor;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@SuppressWarnings("unused")
@Repository
public interface ExhibitorRepository extends JpaRepository<Exhibitor, UUID> {
    Exhibitor findByEmail(String email);
}
