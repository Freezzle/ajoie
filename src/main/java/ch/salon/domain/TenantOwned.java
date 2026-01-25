package ch.salon.domain;

import java.util.UUID;

/**
 * Interface for entities that are tenant-aware.
 * Implementing entities must always be associated with a tenant.
 */
public interface TenantOwned {
    UUID getTenantId();

    void setTenantId(UUID tenantId);
}
