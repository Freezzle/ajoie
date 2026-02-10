package ch.salon.service.mapper;

import ch.salon.domain.BankAccount;
import ch.salon.service.dto.BankAccountDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface BankAccountMapper {

    BankAccountDTO toDto(BankAccount domain);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    BankAccount toEntity(BankAccountDTO dto);
}
