package ch.salon.repository;

import ch.salon.domain.Invoice;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@SuppressWarnings("unused")
@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {}
