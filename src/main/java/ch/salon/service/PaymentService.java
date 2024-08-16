package ch.salon.service;

import ch.salon.repository.PaymentRepository;
import ch.salon.service.dto.PaymentDTO;
import ch.salon.service.mapper.PaymentMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class PaymentService {

    public static final String ENTITY_NAME = "payment";

    private final PaymentRepository paymentRepository;

    public PaymentService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public UUID create(PaymentDTO payment) {
        if (payment.getId() != null) {
            throw new BadRequestAlertException("A new payment cannot already have an ID", ENTITY_NAME, "idexists");
        }

        return paymentRepository.save(PaymentMapper.INSTANCE.toEntity(payment)).getId();
    }

    public PaymentDTO update(final UUID id, PaymentDTO payment) {
        if (payment.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(id, payment.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        if (!paymentRepository.existsById(id)) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        return PaymentMapper.INSTANCE.toDto(paymentRepository.save(PaymentMapper.INSTANCE.toEntity(payment)));
    }

    public List<PaymentDTO> findAll(String idParticipation) {
        if (StringUtils.isNotBlank(idParticipation)) {
            return paymentRepository.findByParticipationId(UUID.fromString(idParticipation)).stream()
                .map(PaymentMapper.INSTANCE::toDto).toList();
        }

        throw new IllegalStateException("No filter given");
    }

    public Optional<PaymentDTO> get(UUID id) {
        return paymentRepository.findById(id).map(PaymentMapper.INSTANCE::toDto);
    }

    public void delete(UUID id) {
        paymentRepository.deleteById(id);
    }
}
