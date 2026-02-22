package ch.salon.service.handlers;

import ch.salon.service.handlers.enums.ContextActionType;
import org.springframework.core.io.InputStreamSource;

import java.io.IOException;
import java.util.Map;

public interface DocumentActionHandler<T> {
    ActionSupport supports(T payload, Map<String, Object> context);

    InputStreamSource download(T payload, Map<String, Object> context) throws IOException;

    ContextActionType getActionType();

    String getFilename(T payload, Map<String, Object> context);
}
