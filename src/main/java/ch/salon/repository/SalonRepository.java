package ch.salon.repository;

import ch.salon.aop.logging.RepositoryAction;
import ch.salon.domain.Salon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
@RepositoryAction("salon")
public interface SalonRepository extends JpaRepository<Salon, UUID> {

    /**
     * Résout le tenant propriétaire d'un salon sans passer par le filtrage multi-tenant d'Hibernate.
     * Indispensable pour les endpoints publics (anonymes), qui s'exécutent en mode SYSTEM et ne
     * verraient donc aucun salon avec une requête JPQL classique.
     */
    @Query(value = "SELECT tenant_id FROM salon WHERE id = :id", nativeQuery = true)
    Optional<UUID> findTenantIdBySalonId(@Param("id") UUID id);
}
