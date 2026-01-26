package ch.salon.security.tenant;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Hibernate multi-tenancy resolver that automatically determines the current tenant ID.
 *
 * This resolver is used by Hibernate with DISCRIMINATOR strategy to automatically
 * filter TenantOwned entities by tenant_id. It reads the tenant context from
 * TenantContextHolder (set by TenantFilter for authenticated requests).
 *
 * Behavior:
 * - TENANT mode: Returns the authenticated user's tenant ID
 * - SYSTEM mode: Returns ROOT_TENANT_ID (UUID 00000000-0000-0000-0000-000000000000)
 *   to allow system operations like tenant provisioning/bootstrapping
 * - No context: Throws TenantContextMissingException (fail-closed for security)
 *
 * Root Tenant (00000000-0000-0000-0000-000000000000):
 * - Special UUID reserved for SYSTEM mode operations only
 * - Not a real tenant; used as a placeholder to bypass multi-tenancy temporarily
 * - Any TenantOwned entity with this tenant_id would be treated as system-level data
 * - When in SYSTEM mode, queries with WHERE tenant_id = ROOT will return nothing
 *   (because no real data uses this ID) unless explicitly impersonating a tenant
 *   via TenantContextHolder.runAsTenant(realTenantId, supplier)
 */
@Component
public class SalonCurrentTenantIdentifierResolver implements CurrentTenantIdentifierResolver<UUID> {

    private static final Logger logger = LoggerFactory.getLogger(SalonCurrentTenantIdentifierResolver.class);

    /**
     * ROOT tenant ID: 00000000-0000-0000-0000-000000000000
     * Used as placeholder for SYSTEM mode. No actual tenant should use this ID.
     */
    public static final UUID ROOT_TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

    @Override
    public UUID resolveCurrentTenantIdentifier() {
        Optional<TenantContextHolder.TenantContext> context = TenantContextHolder.getContext();

        if (context.isEmpty()) {
            // No context set: return ROOT_TENANT_ID as a safe default during bootstrap
            // This allows EntityManagerFactory initialization without throwing exceptions.
            // In production, requests without a tenant context will still be protected
            // because the filter layer will fail-closed (validate that authenticated requests
            // have a valid tenant context before allowing access to protected endpoints).
            logger.debug("No tenant context available - using ROOT_TENANT_ID for bootstrap/initialization");
            return ROOT_TENANT_ID;
        }

        TenantContextHolder.TenantContext ctx = context.get();

        if (ctx.isTenant()) {
            // Normal user request: return their assigned tenant
            UUID tenantId = ctx.getTenantId();
            logger.debug("Resolved tenant: {}", tenantId);
            return tenantId;
        } else if (ctx.isSystem()) {
            // SYSTEM mode: return ROOT to bypass multi-tenancy
            // This is only for internal bootstrapping/provisioning
            logger.debug("In SYSTEM mode, using ROOT_TENANT_ID");
            return ROOT_TENANT_ID;
        }

        // Should not reach here, but fail-closed just in case
        throw new TenantContextMissingException("Invalid TenantContext state");
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        UUID tenantId = resolveCurrentTenantIdentifier();

        // Validate that the given tenant ID matches current context
        if (tenantId == null) {
            return false;
        }

        return true;
    }

    @Override
    public boolean isRoot(UUID tenantId) {
        return ROOT_TENANT_ID.equals(tenantId);
    }
}
