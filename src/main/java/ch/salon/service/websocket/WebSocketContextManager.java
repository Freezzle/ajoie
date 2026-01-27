package ch.salon.service.websocket;

import ch.salon.domain.User;
import ch.salon.repository.UserRepository;
import ch.salon.security.tenant.TenantContextHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Optional;
import java.util.UUID;

@Component
public class WebSocketContextManager {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketContextManager.class);

    private final UserRepository userRepository;

    public WebSocketContextManager(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public <T> T withUserContext(Principal principal, WebSocketContextCallback<T> callback) {
        if (principal == null) {
            logger.warn("WebSocket context: no principal");
            return null;
        }

        String login = principal.getName();
        try {
            User user = userRepository.findOneByLogin(login).orElseThrow();
            if (user.getTenantId() == null) {
                logger.warn("WebSocket context: user {} has no tenantId", login);
                return null;
            }

            UUID tenantId = user.getTenantId();
            Long userId = user.getId();

            TenantContextHolder.setTenantMode(tenantId, userId);
            try {
                logger.debug("WebSocket context: set tenant {} for user {}", tenantId, login);
                return callback.execute(login, tenantId, userId);
            } finally {
                TenantContextHolder.clear();
            }
        } catch (java.util.NoSuchElementException e) {
            logger.warn("WebSocket context: user not found for login={}", login);
            return null;
        }
    }

    public void withUserContext(Principal principal, WebSocketContextRunnable runnable) {
        withUserContext(principal, (login, tenantId, userId) -> {
            runnable.execute(login, tenantId, userId);
            return null;
        });
    }

    @FunctionalInterface
    public interface WebSocketContextCallback<T> {
        T execute(String login, UUID tenantId, Long userId);
    }

    @FunctionalInterface
    public interface WebSocketContextRunnable {
        void execute(String login, UUID tenantId, Long userId);
    }
}
