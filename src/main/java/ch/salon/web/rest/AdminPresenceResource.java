package ch.salon.web.rest;

import ch.salon.security.AuthoritiesConstants;
import ch.salon.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
public class AdminPresenceResource {

    private final PresenceService presence;

    @GetMapping("/summary")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public List<PresenceService.PresenceSummaryDTO> summary() {
        return presence.summary();
    }

    @GetMapping("/count")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN_BUSINESS + "\")")
    public int count() {
        return presence.onlineCount();
    }
}
