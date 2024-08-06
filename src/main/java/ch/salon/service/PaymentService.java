package ch.salon.service;

import ch.salon.domain.Payment;
import ch.salon.repository.PaymentRepository;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    public static final String ENTITY_NAME = "payment";

    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public UUID create(Payment payment) {
        if (payment.getId() != null) {
            throw new BadRequestAlertException("A new payment cannot already have an ID", ENTITY_NAME, "idexists");
        }

        return paymentRepository.save(payment).getId();
    }

    public Payment update(final UUID id, Payment payment) {
        if (payment.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, payment.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!paymentRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        return paymentRepository.save(payment);
    }

    public List<Payment> findAll(String idParticipation) {
        if (StringUtils.isNotBlank(idParticipation)) {
            return paymentRepository.findByParticipationId(UUID.fromString(idParticipation));
        }

        throw new IllegalStateException("No filter given");
    }

    public Optional<Payment> get(UUID id) {
        return paymentRepository.findById(id);
    }

    public void delete(UUID id) {
        paymentRepository.deleteById(id);
    }
}
