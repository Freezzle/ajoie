package ch.salon.security.tenant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Utility class for tenant security checks and operations.
 * Centralizes common multi-tenant validation logic.
 */
@Component
public class TenantSecurityUtil {

    private static final Logger logger = LoggerFactory.getLogger(TenantSecurityUtil.class);

    /**
     * Get the current tenant ID if in TENANT mode.
     * @throws TenantContextMissingException if not in TENANT mode or no context is available
     */
    public UUID getCurrentTenantId() {
        return TenantContextHolder.getContext()
                .filter(TenantContextHolder.TenantContext::isTenant)
                .map(TenantContextHolder.TenantContext::getTenantId)
                .orElseThrow(() -> new TenantContextMissingException(
                        "Tenant context required but not available or in SYSTEM mode"
                ));
    }

    /**
     * Get the current tenant ID if available, or empty if in SYSTEM mode.
     */
    public Optional<UUID> getCurrentTenantIdOptional() {
        return TenantContextHolder.getContext()
                .filter(TenantContextHolder.TenantContext::isTenant)
                .map(TenantContextHolder.TenantContext::getTenantId);
    }

    /**
     * Check if current context has the given tenant ID.
     * Useful for verifying ownership of cross-tenant operations.
     */
    public boolean isCurrentTenant(UUID tenantId) {
        return TenantContextHolder.getContext()
                .filter(TenantContextHolder.TenantContext::isTenant)
                .map(ctx -> ctx.getTenantId().equals(tenantId))
                .orElse(false);
    }

    /**
     * Check if in SYSTEM mode
     */
    public boolean isSystemMode() {
        return TenantContextHolder.isSystemMode();
    }

    /**
     * Check if in TENANT mode
     */
    public boolean isTenantMode() {
        return TenantContextHolder.isTenantMode();
    }

    /**
     * Assert that we are in TENANT mode, throw exception otherwise
     */
    public void assertTenantMode() {
        if (!isTenantMode()) {
            throw new TenantContextMissingException(
                    "This operation requires TENANT mode but context is in SYSTEM mode or missing"
            );
        }
    }

    /**
     * Log a cross-tenant operation attempt (potential security issue)
     */
    public void logCrossTenantAttempt(UUID attemptedTenantId, UUID currentTenantId, String operation) {
        logger.warn("Cross-tenant operation attempt: user tried to access tenantId={} but their context is tenantId={}, operation={}",
                attemptedTenantId, currentTenantId, operation);
    }
}
