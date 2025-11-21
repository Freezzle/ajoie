package ch.salon.repository;

import ch.salon.aop.logging.RepositoryAction;
import ch.salon.domain.Salon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
@RepositoryAction("salon")
public interface SalonRepository extends JpaRepository<Salon, UUID> {
}
