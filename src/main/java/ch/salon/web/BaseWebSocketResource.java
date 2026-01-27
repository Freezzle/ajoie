package ch.salon.web;

import ch.salon.service.websocket.WebSocketContextManager;
import ch.salon.service.websocket.WebSocketEventBus;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Base class for all WebSocket handlers.
 * Provides common utilities for context management and event publishing.
 */
@RequiredArgsConstructor
public abstract class BaseWebSocketResource {

    protected static final Logger logger = LoggerFactory.getLogger(BaseWebSocketResource.class);

    protected final WebSocketContextManager contextManager;
    protected final WebSocketEventBus eventBus;
}
