package ch.salon.config;

import ch.salon.domain.User;
import ch.salon.repository.UserRepository;
import ch.salon.security.tenant.TenantContextHolder;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.Optional;
import java.util.UUID;

@Component
public class WebSocketTenantInterceptor implements ChannelInterceptor {

    private final UserRepository userRepository;

    public WebSocketTenantInterceptor(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand()) ||
            StompCommand.SEND.equals(accessor.getCommand()) ||
            StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {

            Principal principal = accessor.getUser();

            if (principal != null) {
                String login = principal.getName();
                try {
                    User user = userRepository.findOneByLogin(login).orElseThrow();
                    if (user.getTenantId() != null) {
                        TenantContextHolder.setTenantMode(user.getTenantId(), user.getId());
                    }
                } catch (java.util.NoSuchElementException e) {
                    // User not found, skip tenant context setup
                }
            }
        }

        return message;
    }

    @Override
    public void afterSendCompletion(Message<?> message, MessageChannel channel, boolean sent, Exception ex) {
        TenantContextHolder.clear();
    }
}
