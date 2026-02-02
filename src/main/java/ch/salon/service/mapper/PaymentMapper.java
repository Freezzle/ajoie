package ch.salon.service.mapper;

import ch.salon.domain.Payment;
import ch.salon.service.dto.PaymentDTO;
import ch.salon.service.dto.PaymentLightDTO;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface PaymentMapper {

    PaymentDTO toDto(Payment payment);

    @Mapping(target = "tenantId", ignore = true)
    Payment toEntity(PaymentDTO payment);

    PaymentLightDTO toLightDto(Payment payment);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    Payment toRefEntity(PaymentLightDTO payment);
}
