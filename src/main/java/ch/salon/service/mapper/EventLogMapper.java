package ch.salon.service.mapper;

import ch.salon.domain.EventLog;
import ch.salon.service.dto.EventLogDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.ReportingPolicy;

import java.util.HashMap;
import java.util.Map;

@Mapper(componentModel = "spring", uses = {ExhibitorMapper.class}, unmappedTargetPolicy = ReportingPolicy.ERROR)
public abstract class EventLogMapper {
    protected ObjectMapper objectMapper = new ObjectMapper();

    @Mapping(target = "extraAttributes", source = "payloadJson", qualifiedByName = "jsonToMap")
    public abstract EventLogDTO toDto(EventLog eventLog);

    @Named("jsonToMap")
    public Map<String, String> jsonToMap(String payloadJson) {
        if (payloadJson == null || payloadJson.isEmpty()) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(payloadJson,
                    objectMapper.getTypeFactory().constructMapType(Map.class, String.class, String.class));
        } catch (Exception e) {
            throw new RuntimeException("Failed to convert JSON to Map", e);
        }
    }
}
