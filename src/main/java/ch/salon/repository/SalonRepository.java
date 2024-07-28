package ch.salon.repository;

import ch.salon.domain.Salon;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@SuppressWarnings("unused")
@Repository
public interface SalonRepository extends JpaRepository<Salon, UUID> {}
