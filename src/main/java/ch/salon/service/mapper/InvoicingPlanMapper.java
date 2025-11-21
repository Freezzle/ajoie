package ch.salon.service.mapper;

import ch.salon.domain.InvoicingPlan;
import ch.salon.service.dto.InvoicingPlanDTO;
import ch.salon.service.dto.InvoicingPlanLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",uses = {ParticipationMapper.class, InvoiceMapper.class}, unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InvoicingPlanMapper {

    InvoicingPlanDTO toDto(InvoicingPlan invoice);

    InvoicingPlan toEntity(InvoicingPlanDTO invoice);

    InvoicingPlanLightDTO toLightDto(InvoicingPlan invoice);

    @Mapping(target = "billingNumber", ignore = true)
    InvoicingPlan toLightEntity(InvoicingPlanLightDTO invoice);
}
