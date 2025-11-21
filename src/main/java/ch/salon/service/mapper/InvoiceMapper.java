package ch.salon.service.mapper;

import ch.salon.domain.Invoice;
import ch.salon.service.dto.InvoiceDTO;
import ch.salon.service.dto.InvoiceLightDTO;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface InvoiceMapper {

    InvoiceDTO toDto(Invoice invoice);

    Invoice toEntity(InvoiceDTO invoice);

    InvoiceLightDTO toLightDto(Invoice invoice);

    Invoice toLightEntity(InvoiceLightDTO invoice);
}
