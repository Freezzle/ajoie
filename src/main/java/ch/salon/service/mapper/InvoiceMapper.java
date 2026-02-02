package ch.salon.service.mapper;

import ch.salon.domain.Invoice;
import ch.salon.service.dto.InvoiceDTO;
import ch.salon.service.dto.InvoiceLightDTO;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface InvoiceMapper {

    InvoiceDTO toDto(Invoice invoice);

    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "position", ignore = true)
    @Mapping(target = "reduction", ignore = true)
    Invoice toEntity(InvoiceDTO invoice);

    InvoiceLightDTO toLightDto(Invoice invoice);

    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    Invoice toRefEntity(InvoiceLightDTO invoice);
}
