package ch.salon.web.rest;

import ch.salon.repository.EventLogRepository;
import ch.salon.security.AuthoritiesConstants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/events")
@Transactional
public class AdminEventResource {
    private final EventLogRepository eventLogRepository;

    @Value("${jhipster.clientApp.name}")
    private String applicationName;

    public AdminEventResource(EventLogRepository eventLogRepository) {
        this.eventLogRepository = eventLogRepository;
    }

    @DeleteMapping("/{idEvent}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public void getAllLogs(@PathVariable(value = "idEvent", required = true) final UUID idEvent) {

        this.eventLogRepository.deleteById(idEvent);
    }
}
