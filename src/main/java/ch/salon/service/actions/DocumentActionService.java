package ch.salon.service.actions;

import ch.salon.service.handlers.DocumentActionHandler;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DocumentActionService {
    private final Map<String, DocumentActionHandler<?>> handlers;

    public DocumentActionService(List<DocumentActionHandler<?>> handlers) {
        this.handlers = handlers.stream().collect(Collectors.toMap(h -> h.getActionType().code(), h -> h));
    }

    public Map<String, DocumentActionHandler<?>> getHandlers() {
        return handlers;
    }
}
