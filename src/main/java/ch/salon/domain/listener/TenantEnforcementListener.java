package ch.salon.domain.listener;

import ch.salon.domain.TenantOwned;
import ch.salon.security.tenant.TenantContextHolder;
import org.hibernate.event.spi.PreInsertEvent;
import org.hibernate.event.spi.PreInsertEventListener;
import org.hibernate.event.spi.PreUpdateEvent;
import org.hibernate.event.spi.PreUpdateEventListener;
import org.hibernate.persister.entity.EntityPersister;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Hibernate event listener that automatically enforces tenant_id on TenantOwned entities.
 *
 * For INSERT (PreInsert):
 * - If in TENANT mode: set tenantId if null, or verify it matches current tenantId
 * - If in SYSTEM mode: require explicit tenantId (for internal tenant creation)
 *
 * For UPDATE (PreUpdate):
 * - If in TENANT mode: verify tenantId matches current tenantId (prevent privilege escalation)
 * - If in SYSTEM mode: allow updates but log as audit trail
 *
 * IMPORTANT: This listener works in conjunction with Hibernate's @TenantId DISCRIMINATOR strategy.
 * The @TenantId annotation on fields enables automatic filtering for ALL reads,
 * while this listener enforces constraints on writes.
 */
@Component
public class TenantEnforcementListener implements PreInsertEventListener, PreUpdateEventListener {

    private static final Logger logger = LoggerFactory.getLogger(TenantEnforcementListener.class);

    @Override
    public boolean onPreInsert(PreInsertEvent event) {
        Object entity = event.getEntity();

        if (!(entity instanceof TenantOwned tenantOwnedEntity)) {
            return false; // Not a tenant-owned entity, proceed normally
        }

        Optional<TenantContextHolder.TenantContext> context = TenantContextHolder.getContext();

        if (context.isPresent()) {
            TenantContextHolder.TenantContext ctx = context.get();

            if (ctx.isTenant()) {
                // We are in TENANT mode: user is creating/modifying their own data
                UUID currentTenantId = ctx.getTenantId();
                UUID entityTenantId = tenantOwnedEntity.getTenantId();

                if (entityTenantId == null) {
                    // Set the tenant_id from context
                    tenantOwnedEntity.setTenantId(currentTenantId);
                    setPropertyValue(event, "tenantId", currentTenantId);
                    logger.debug("Set tenantId from context for entity: {}", entity.getClass().getSimpleName());
                } else if (!entityTenantId.equals(currentTenantId)) {
                    // Tenant mismatch: security violation
                    throw new SecurityException(
                            String.format("Tenant mismatch on INSERT: entity has tenantId=%s but context has tenantId=%s",
                                    entityTenantId, currentTenantId)
                    );
                }
            } else if (ctx.isSystem()) {
                // SYSTEM mode: allow any tenantId, but require it to be set
                if (tenantOwnedEntity.getTenantId() == null) {
                    throw new IllegalStateException("TenantOwned entity requires explicit tenantId when inserting in SYSTEM mode");
                }
            }
        } else {
            throw new SecurityException("No tenant context ! No reason to insert without tenantId context");
        }

        return false; // Return false to continue normal persistence
    }

    @Override
    public boolean onPreUpdate(PreUpdateEvent event) {
        Object entity = event.getEntity();

        if (!(entity instanceof TenantOwned tenantOwnedEntity)) {
            return false; // Not a tenant-owned entity, proceed normally
        }

        Optional<TenantContextHolder.TenantContext> context = TenantContextHolder.getContext();

        if (context.isPresent()) {
            TenantContextHolder.TenantContext ctx = context.get();

            if (ctx.isTenant()) {
                // We are in TENANT mode: user is updating their own data
                UUID currentTenantId = ctx.getTenantId();
                UUID entityTenantId = tenantOwnedEntity.getTenantId();

                if (entityTenantId != null && !entityTenantId.equals(currentTenantId)) {
                    // Tenant mismatch: security violation
                    throw new SecurityException(
                            String.format("Tenant mismatch on UPDATE: entity has tenantId=%s but context has tenantId=%s",
                                    entityTenantId, currentTenantId)
                    );
                }
            } else if (ctx.isSystem()) {
                // SYSTEM mode: allow updates but log as audit trail
                logger.debug("System mode update on TenantOwned entity: {} with tenantId={}",
                    entity.getClass().getSimpleName(), tenantOwnedEntity.getTenantId());
            }
        } else {
            throw new SecurityException("No tenant context ! No reason to update without tenantId context");
        }

        return false; // Return false to continue normal persistence
    }

    /**
     * Helper to set a property value in the Hibernate event state array
     */
    private void setPropertyValue(PreInsertEvent event, String propertyName, Object value) {
        EntityPersister persister = event.getPersister();
        int index = persister.getPropertyIndex(propertyName);
        if (index >= 0) {
            event.getState()[index] = value;
        }
    }
}
