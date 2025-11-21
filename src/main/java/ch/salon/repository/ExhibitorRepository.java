package ch.salon.repository;

import ch.salon.domain.Exhibitor;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExhibitorRepository extends JpaRepository<Exhibitor, UUID> {

    @EntityGraph(attributePaths = {"billingAddress"})
    List<Exhibitor> findByOrderByRegistrationDateDesc();

    List<Exhibitor> findAllByPhoneNumberIsEndingWithIgnoreCase(String phoneNumber);

    List<Exhibitor> findAllByFullNameContainingIgnoreCaseAndFullNameContainingIgnoreCase(String firstName,
            String lastName);

    Exhibitor findByEmail(String email);

    List<Exhibitor> findAllByNewsletterIsTrue();
}
