package ch.salon.web;

import ch.salon.service.actions.BusinessActionService;
import ch.salon.service.actions.DocumentActionService;
import ch.salon.service.actions.EmailActionService;
import ch.salon.service.actions.PermissionActionService;
import ch.salon.service.handlers.ActionAvailable;
import ch.salon.service.handlers.ActionMetadataProvider;
import ch.salon.service.handlers.BusinessActionHandler;
import ch.salon.service.handlers.DocumentActionHandler;
import ch.salon.service.handlers.EmailActionHandler;
import ch.salon.service.handlers.EmailMessage;
import ch.salon.service.handlers.RequiredField;
import ch.salon.service.handlers.enums.ActionType;
import ch.salon.service.handlers.enums.ContextActionType;
import ch.salon.service.handlers.enums.SupportType;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.InputStreamSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api/actions")
public class AvailabilityActionController {

    private final EmailActionService emailService;
    private final DocumentActionService documentService;
    private final BusinessActionService businessService;
    private final Map<String, JpaRepository<?, UUID>> repositories;
    private final PermissionActionService permissionService;

    public AvailabilityActionController(EmailActionService emailService, DocumentActionService documentService,
            BusinessActionService businessService,
            @Qualifier("actionRepositories") Map<String, JpaRepository<?, UUID>> repositories,
            PermissionActionService permissionService) {
        this.emailService = emailService;
        this.documentService = documentService;
        this.businessService = businessService;
        this.repositories = repositories;
        this.permissionService = permissionService;
    }

    @GetMapping("/{domain}/{id}/available")
    //@Cacheable(value = "availableActions", key = "#domain + '-' + #id + '-' + authentication.name")
    @Transactional(readOnly = true)
    public ResponseEntity<List<ActionAvailable>> getAvailableActions(@PathVariable String domain, @PathVariable UUID id,
            Authentication authentication) {
        Object payload = getEntity(domain, id);

        List<ActionAvailable> actions = new ArrayList<>();
        Stream.of(emailService.getHandlers().entrySet(), documentService.getHandlers().entrySet(),
                businessService.getHandlers().entrySet()).flatMap(Set::stream).forEach(entry -> {

            ContextActionType.fromCode(entry.getKey()).ifPresent(context -> {
                if (context.repositoryName().equals(domain)) {
                    Object handler = entry.getValue();
                    ActionType type = ActionType.fromHandler(handler);

                    SupportType supportType = type.supports(handler, payload, new HashMap<>());

                    if (supportType != SupportType.REJECTED &&
                            permissionService.isAllowed(context.code(), payload, authentication)) {

                        boolean needsConfirmation = false;
                        List<RequiredField> requiredFields = Collections.emptyList();
                        String helpKey = null;

                        // Extract metadata for BusinessActionHandler
                        if (handler instanceof BusinessActionHandler && handler instanceof ActionMetadataProvider) {
                            ActionMetadataProvider metadataProvider = (ActionMetadataProvider) handler;
                            needsConfirmation = metadataProvider.needsConfirmation();
                            requiredFields = metadataProvider.getRequiredFields();
                            helpKey = metadataProvider.getHelpKey();
                        }

                        actions.add(new ActionAvailable(context.code(), type, supportType == SupportType.DISABLED,
                                "action." + context.code(), helpKey, needsConfirmation, requiredFields));
                    }
                }
            });
        });

        return ResponseEntity.ok(actions);
    }

    @PostMapping("/email/{context}/{id}")
    @Transactional
    public ResponseEntity<Void> handleEmail(@PathVariable String context, @PathVariable UUID id,
            @RequestBody Map<String, Object> payload, Authentication authentication) throws Exception {

        var handler = (EmailActionHandler<Object>) emailService.getHandlers().get(context);
        Object entity = getEntityFromContext(context, id);

        if (handler.supports(entity, payload) == SupportType.ALLOWED &&
                permissionService.isAllowed(context, entity, authentication)) {
            handler.handle(entity, payload);
            return ResponseEntity.ok().build();
        } else {
            throw new ResponseStatusException(UNAUTHORIZED);
        }
    }

    @GetMapping("/email/{context}/{id}/template")
    @Transactional(readOnly = true)
    public ResponseEntity<EmailMessage> getEmailTemplate(@PathVariable String context, @PathVariable UUID id,
            Locale locale) {

        var handler = (EmailActionHandler<Object>) emailService.getHandlers().get(context);
        Object payload = getEntityFromContext(context, id);
        EmailMessage email = handler.buildTemplate(payload, Map.of("language", locale));
        return ResponseEntity.ok(email);
    }

    @PostMapping("/business/{context}/{id}")
    @Transactional
    public ResponseEntity<Void> executeBusiness(@PathVariable String context, @PathVariable UUID id,
            @RequestBody Map<String, Object> payload, Authentication authentication) {
        var handler = (BusinessActionHandler<Object>) businessService.getHandlers().get(context);
        Object entity = getEntityFromContext(context, id);

        if (handler.supports(entity, payload) == SupportType.ALLOWED &&
                permissionService.isAllowed(context, entity, authentication)) {
            handler.execute(entity, payload);
            return ResponseEntity.ok().build();
        } else {
            throw new ResponseStatusException(UNAUTHORIZED);
        }
    }

    @GetMapping("/download/{context}/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<InputStreamSource> download(@PathVariable String context, @PathVariable UUID id,
            @RequestParam Map<String, Object> payload, Authentication authentication) throws IOException {
        var handler = (DocumentActionHandler<Object>) documentService.getHandlers().get(context);
        Object entity = getEntityFromContext(context, id);

        if (handler.supports(entity, payload) == SupportType.ALLOWED &&
                permissionService.isAllowed(context, entity, authentication)) {
            InputStreamSource file = handler.download(entity, new HashMap<>(payload));
            String fileName = handler.getFilename(entity, new HashMap<>(payload));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(ContentDisposition.attachment().filename(fileName).build());

            return ResponseEntity.ok().headers(headers).body(file);
        } else {
            throw new ResponseStatusException(UNAUTHORIZED);
        }
    }

    private Object getEntity(String domain, UUID id) {
        JpaRepository<?, UUID> repo = repositories.get(domain);
        if (repo == null) {
            throw new ResponseStatusException(NOT_FOUND, "Repository not found " + domain);
        }

        return repo.findById(id)
                   .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Entity not found " + domain + "-" + id));
    }

    private Object getEntityFromContext(String contextCode, UUID id) {
        return ContextActionType.fromCode(contextCode).map(ctx -> getEntity(ctx.repositoryName(), id))
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST));
    }
}
