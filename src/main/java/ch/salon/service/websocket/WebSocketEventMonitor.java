package ch.salon.service.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class WebSocketEventMonitor {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventMonitor.class);

    private final AtomicLong totalConnections = new AtomicLong(0);
    private final AtomicLong totalDisconnections = new AtomicLong(0);
    private final AtomicLong totalMessagesSent = new AtomicLong(0);
    private final ConcurrentHashMap<String, Instant> activeSessions = new ConcurrentHashMap<>();

    @EventListener
    public void onUserConnected(WebSocketEventBus.WebSocketUserConnectedEvent event) {
        totalConnections.incrementAndGet();
        activeSessions.put(event.getSessionId(), Instant.now());
        logger.info("WebSocket connected: user={}, sessionId={}, tenant={}, activeSessions={}",
                event.getLogin(), event.getSessionId(), event.getTenantId(), activeSessions.size());
    }

    @EventListener
    public void onUserDisconnected(WebSocketEventBus.WebSocketUserDisconnectedEvent event) {
        totalDisconnections.incrementAndGet();
        activeSessions.remove(event.getSessionId());
        logger.info("WebSocket disconnected: sessionId={}, activeSessions={}",
                event.getSessionId(), activeSessions.size());
    }

    @EventListener
    public void onMessageSent(WebSocketEventBus.WebSocketMessageSentEvent event) {
        totalMessagesSent.incrementAndGet();
        logger.debug("WebSocket message: sender={}, recipient={}, tenant={}",
                event.getSenderId(), event.getRecipientId(), event.getTenantId());
    }
}
