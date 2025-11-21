package ch.salon.service.actions;

import ch.salon.service.handlers.EmailActionHandler;
import lombok.Getter;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Getter
public class EmailActionService {
    private final Map<String, EmailActionHandler<?>> handlers;

    public EmailActionService(List<EmailActionHandler<?>> handlers) {
        this.handlers = handlers.stream().collect(Collectors.toMap(h -> h.getActionType().code(), h -> h));
    }
}
