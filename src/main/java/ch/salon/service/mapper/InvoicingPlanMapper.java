package ch.salon.service.mapper;

import ch.salon.domain.InvoicingPlan;
import ch.salon.service.dto.InvoicingPlanDTO;
import ch.salon.service.dto.InvoicingPlanListDTO;
import ch.salon.service.dto.InvoicingPlanLightDTO;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",uses = {ParticipationMapper.class, InvoiceMapper.class}, unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface InvoicingPlanMapper {

    InvoicingPlanDTO toDto(InvoicingPlan invoice);

    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "payments", ignore = true)
    @Mapping(target = "invoices", ignore = true)
    InvoicingPlan toEntity(InvoicingPlanDTO invoice);

    InvoicingPlanLightDTO toLightDto(InvoicingPlan invoice);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    InvoicingPlan toRefEntity(InvoicingPlanLightDTO invoice);

    @Mapping(target = "nbInvoiceLines", expression = "java(invoicingPlan.getInvoices().size())")
    @Mapping(target = "totalAmount", expression = "java(invoicingPlan.getInvoicesTotal())")
    @Mapping(target = "paidAmount", expression = "java(invoicingPlan.getPaymentsTotal())")
    @Mapping(target = "balance", expression = "java(invoicingPlan.getInvoicesTotal() - invoicingPlan.getPaymentsTotal())")
    InvoicingPlanListDTO toListDto(InvoicingPlan invoicingPlan);
}
