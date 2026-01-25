package ch.salon.service.tenant;

import ch.salon.domain.Tenant;
import ch.salon.domain.User;
import ch.salon.repository.TenantRepository;
import ch.salon.repository.UserRepository;
import ch.salon.security.tenant.TenantContextHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Service for creating and managing tenants.
 * Only SYSTEM code can create tenants; normal users cannot.
 */
@Service
@Transactional
public class TenantProvisioningService {

    private static final Logger logger = LoggerFactory.getLogger(TenantProvisioningService.class);

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    public TenantProvisioningService(TenantRepository tenantRepository, UserRepository userRepository) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create a new tenant with the given name and owner.
     * This must be executed in SYSTEM mode.
     *
     * @param tenantName  The name of the tenant
     * @param tenantSlug  The slug for the tenant (URL-friendly name)
     * @param ownerUserId The UUID of the user who will own this tenant
     * @return The created Tenant
     * @throws IllegalStateException if not in SYSTEM mode
     */
    public Tenant createTenant(String tenantName, String tenantSlug, UUID ownerUserId) {
        if (!TenantContextHolder.isSystemMode()) {
            throw new IllegalStateException("createTenant must be called in SYSTEM mode");
        }

        logger.info("Creating new tenant: name={}, slug={}", tenantName, tenantSlug);

        // Create the tenant
        Tenant tenant = Tenant.builder()
                .name(tenantName)
                .slug(tenantSlug)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        tenant = tenantRepository.save(tenant);

        // Assign the owner user to this tenant
        assignUserToTenant(ownerUserId, tenant.getId(), true);

        logger.info("Tenant created successfully: id={}, name={}", tenant.getId(), tenantName);

        return tenant;
    }

    /**
     * Assign a user to a tenant.
     *
     * @param userId   The UUID of the user
     * @param tenantId The UUID of the tenant
     * @param isOwner  Whether the user is the tenant owner
     */
    public void assignUserToTenant(UUID userId, UUID tenantId, boolean isOwner) {
        User user = userRepository.findById(Long.parseLong(userId.toString()))
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        user.setTenantId(tenantId);
        user.setTenantOwner(isOwner);
        user.setTenantMemberStatus("ACTIVE");

        userRepository.save(user);

        logger.info("User {} assigned to tenant {} as {}", userId, tenantId, isOwner ? "owner" : "member");
    }
}
