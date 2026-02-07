package ch.salon.web.rest;

import ch.salon.repository.EventLogRepository;
import ch.salon.security.AuthoritiesConstants;
import ch.salon.utils.ResourceUtil;
import org.springframework.http.ResponseEntity;
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

    private static final String ENTITY_NAME = "event";
    private final EventLogRepository eventLogRepository;

    public AdminEventResource(EventLogRepository eventLogRepository) {
        this.eventLogRepository = eventLogRepository;
    }

    @DeleteMapping("/{idEvent}")
    @PreAuthorize("hasAuthority(\"" + AuthoritiesConstants.ADMIN + "\")")
    public ResponseEntity<Void> deleteEvent(@PathVariable("idEvent") UUID idEvent) {
        this.eventLogRepository.deleteById(idEvent);
        return ResourceUtil.deleted(ENTITY_NAME, idEvent).build();
    }
}
