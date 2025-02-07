package ch.salon.repository;

import ch.salon.domain.DimensionStand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@SuppressWarnings("unused")
@Repository
public interface DimensionStandRepository extends JpaRepository<DimensionStand, UUID> {}
