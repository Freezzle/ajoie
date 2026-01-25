package ch.salon.web.rest;

import ch.salon.domain.User;
import ch.salon.repository.TenantRepository;
import ch.salon.repository.UserRepository;
import ch.salon.security.SecurityUtils;
import ch.salon.service.dto.TenantDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * REST controller for tenant information.
 * Provides endpoints to retrieve tenant metadata for the current user.
 */
@RestController
@RequestMapping("/api/tenant")
public class TenantResource {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    public TenantResource(TenantRepository tenantRepository, UserRepository userRepository) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/tenant/me
     * Returns the current user's tenant information
     */
    @GetMapping("/me")
    public ResponseEntity<TenantDTO> getTenantInfo() {
        // Get current user login
        Optional<String> userLogin = SecurityUtils.getCurrentUserLogin();
        if (userLogin.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // Get user from DB
        Optional<User> user = userRepository.findOneByLogin(userLogin.get());
        if (user.isEmpty() || user.get().getTenantId() == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Get tenant info
        User currentUser = user.get();
        Optional<?> tenantOpt = tenantRepository.findById(currentUser.getTenantId());

        if (tenantOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        // Build DTO - manually since we don't have mapstruct setup
        var tenant = tenantOpt.get();
        var tenantDTO = new TenantDTO(
                currentUser.getTenantId(),
                (String) getFieldValue(tenant, "name"),
                (String) getFieldValue(tenant, "slug"),
                currentUser.isTenantOwner(),
                currentUser.getTenantMemberStatus()
        );

        return ResponseEntity.ok(tenantDTO);
    }

    /**
     * Helper to extract field value from tenant using reflection
     * (Since we don't have the tenant instance in the import, this is a workaround)
     */
    private Object getFieldValue(Object tenant, String fieldName) {
        try {
            var field = tenant.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            return field.get(tenant);
        } catch (Exception e) {
            return null;
        }
    }
}
