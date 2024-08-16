package ch.salon.service.mapper;

import ch.salon.domain.Payment;
import ch.salon.service.dto.PaymentDTO;
import ch.salon.service.dto.PaymentLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(uses = {ParticipationMapper.class}, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PaymentMapper {
    PaymentMapper INSTANCE = Mappers.getMapper(PaymentMapper.class);

    PaymentDTO toDto(Payment payment);

    Payment toEntity(PaymentDTO payment);

    PaymentLightDTO toLightDto(Payment payment);

    @Mapping(target = "amount", ignore = true)
    Payment toLightEntity(PaymentLightDTO payment);
}
