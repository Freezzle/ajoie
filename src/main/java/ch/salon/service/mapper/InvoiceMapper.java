package ch.salon.service.mapper;

import ch.salon.domain.Invoice;
import ch.salon.service.dto.InvoiceDTO;
import ch.salon.service.dto.InvoiceLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InvoiceMapper {
    InvoiceMapper INSTANCE = Mappers.getMapper(InvoiceMapper.class);

    InvoiceDTO toDto(Invoice invoice);

    Invoice toEntity(InvoiceDTO invoice);

    InvoiceLightDTO toLightDto(Invoice invoice);

    @Mapping(target = "total", ignore = true)
    Invoice toLightEntity(InvoiceLightDTO invoice);
}
