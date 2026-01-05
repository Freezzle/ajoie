package ch.salon.web;

import ch.salon.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class AdminPresenceWebsocketResource {

    private final PresenceService presence;

    @MessageMapping("/presence/ping")
    public void ping(Principal principal) {
        if (principal != null) {
            presence.heartbeat(principal.getName());
        }
    }
}
