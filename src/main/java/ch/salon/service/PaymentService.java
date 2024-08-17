package ch.salon.service;

import ch.salon.domain.Payment;
import ch.salon.domain.enumeration.EntityType;
import ch.salon.domain.enumeration.EventType;
import ch.salon.repository.ParticipationRepository;
import ch.salon.repository.PaymentRepository;
import ch.salon.service.dto.PaymentDTO;
import ch.salon.service.mapper.ParticipationMapper;
import ch.salon.service.mapper.PaymentMapper;
import ch.salon.web.rest.errors.BadRequestAlertException;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

    public static final String ENTITY_NAME = "payment";

    private final PaymentRepository paymentRepository;
    private final ParticipationRepository participationRepository;
    private final EventLogService eventLogService;

    public PaymentService(
        PaymentRepository paymentRepository,
        ParticipationRepository participationRepository,
        EventLogService eventLogService
    ) {
        this.paymentRepository = paymentRepository;
        this.participationRepository = participationRepository;
        this.eventLogService = eventLogService;
    }

    public UUID create(UUID idParticipation, PaymentDTO payment) {
        if (payment.getId() != null) {
            throw new BadRequestAlertException("A new payment cannot already have an ID", ENTITY_NAME, "idexists");
        }

        payment.setParticipation(ParticipationMapper.INSTANCE.toLightDto(participationRepository.getReferenceById(idParticipation)));

        this.eventLogService.eventFromSystem("Un paiement a été ajouté.", EventType.PAYMENT, EntityType.PARTICIPATION, idParticipation);
        return paymentRepository.save(PaymentMapper.INSTANCE.toEntity(payment)).getId();
    }

    public PaymentDTO update(UUID idParticipation, final UUID idPayment, PaymentDTO payment) {
        if (payment.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        if (!Objects.equals(idPayment, payment.getId())) {
            throw new BadRequestAlertException("Invalid ID", ENTITY_NAME, "idinvalid");
        }

        Payment paymentFound = paymentRepository.getReferenceById(idPayment);

        if (paymentFound == null) {
            throw new BadRequestAlertException("Entity not found", ENTITY_NAME, "idnotfound");
        }

        if (!Objects.equals(paymentFound.getAmount(), payment.getAmount())) {
            this.eventLogService.eventFromSystem("Un paiement a été changé.", EventType.PAYMENT, EntityType.PARTICIPATION, idParticipation);
        }

        paymentFound.setPaymentMode(payment.getPaymentMode());
        paymentFound.setAmount(payment.getAmount());
        paymentFound.setExtraInformation(payment.getExtraInformation());
        paymentFound.setBillingDate(payment.getBillingDate());

        return PaymentMapper.INSTANCE.toDto(paymentRepository.save(paymentFound));
    }

    public List<PaymentDTO> findAll(String idParticipation) {
        if (StringUtils.isNotBlank(idParticipation)) {
            return paymentRepository
                .findByParticipationIdOrderByBillingDateDesc(UUID.fromString(idParticipation))
                .stream()
                .map(PaymentMapper.INSTANCE::toDto)
                .toList();
        }

        throw new IllegalStateException("No filter given");
    }

    public void delete(UUID idParticipation, UUID idPayment) {
        paymentRepository.deleteById(idPayment);
        this.eventLogService.eventFromSystem("Un paiement a été supprimé.", EventType.PAYMENT, EntityType.PARTICIPATION, idParticipation);
    }
}
