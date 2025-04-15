package ch.salon.service.actions;

import ch.salon.service.handlers.BusinessActionHandler;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class BusinessActionService {
    private final Map<String, BusinessActionHandler<?>> handlers;

    public BusinessActionService(List<BusinessActionHandler<?>> handlers) {
        this.handlers = handlers.stream().collect(Collectors.toMap(h -> h.getActionType().code(), h -> h));
    }

    public Map<String, BusinessActionHandler<?>> getHandlers() {
        return handlers;
    }
}
