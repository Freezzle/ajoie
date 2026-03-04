package ch.salon.repository;

import ch.salon.domain.PriceStandSalon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PriceStandSalonRepository extends JpaRepository<PriceStandSalon, UUID> {
    @Query("SELECT p FROM PriceStandSalon p WHERE p.id IN (SELECT ps.id FROM Salon s JOIN s.priceStandSalons ps WHERE s.id = :salonId)")
    List<PriceStandSalon> findBySalonId(UUID salonId);
}
