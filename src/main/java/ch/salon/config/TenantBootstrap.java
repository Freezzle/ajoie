package ch.salon.config;

import ch.salon.domain.Tenant;
import ch.salon.domain.User;
import ch.salon.repository.TenantRepository;
import ch.salon.repository.UserRepository;
import ch.salon.security.tenant.TenantContextHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Bootstrap component to initialize default tenant and assign users if needed.
 * This runs after application startup to ensure multi-tenancy is properly set up.
 */
@Component
public class TenantBootstrap {

    private static final Logger logger = LoggerFactory.getLogger(TenantBootstrap.class);
    private static final UUID DEFAULT_TENANT_ID = UUID.fromString("a8d5c7e1-1234-5678-9abc-def012345678");
    private static final String DEFAULT_TENANT_NAME = "L'Ajoie de mieux vivre";
    private static final String DEFAULT_TENANT_SLUG = "ajoie-de-mieux-vivre";

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    public TenantBootstrap(TenantRepository tenantRepository, UserRepository userRepository) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
    }

    /**
     * Initialize tenants on application startup
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void initializeTenants() {
        logger.info("Initializing multi-tenancy on application startup...");

        try {
            TenantContextHolder.runAsSystem(() -> {
                // Check if default tenant exists
                Optional<Tenant> existingTenant = tenantRepository.findById(DEFAULT_TENANT_ID);

                if (existingTenant.isEmpty()) {
                    logger.info("Creating default tenant: {}", DEFAULT_TENANT_NAME);
                    Tenant defaultTenant = Tenant.builder()
                            .id(DEFAULT_TENANT_ID)
                            .name(DEFAULT_TENANT_NAME)
                            .slug(DEFAULT_TENANT_SLUG)
                            .createdAt(Instant.now())
                            .updatedAt(Instant.now())
                            .build();
                    tenantRepository.save(defaultTenant);
                } else {
                    logger.info("Default tenant already exists with ID: {}", DEFAULT_TENANT_ID);
                }

                // Ensure all users are assigned to a tenant
                assignUsersToTenants();
            });

            logger.info("Multi-tenancy initialization completed successfully");
        } catch (Exception e) {
            logger.error("Error during multi-tenancy initialization", e);
            throw new RuntimeException("Failed to initialize multi-tenancy", e);
        }
    }

    /**
     * Assign any unassigned users to the default tenant and set ownership
     */
    private void assignUsersToTenants() {
        // Find users without a tenant
        var usersWithoutTenant = userRepository.findAll().stream()
                .filter(u -> u.getTenantId() == null)
                .toList();

        if (!usersWithoutTenant.isEmpty()) {
            logger.info("Assigning {} users to default tenant", usersWithoutTenant.size());

            for (User user : usersWithoutTenant) {
                user.setTenantId(DEFAULT_TENANT_ID);
                user.setTenantMemberStatus("ACTIVE");
                userRepository.save(user);
            }
        }

        // Set the admin user as tenant owner if not already set
        var adminUser = userRepository.findOneByLogin("admin");
        if (adminUser.isPresent() && !adminUser.get().isTenantOwner() &&
            adminUser.get().getTenantId().equals(DEFAULT_TENANT_ID)) {
            logger.info("Setting admin user as tenant owner");
            adminUser.get().setTenantOwner(true);
            userRepository.save(adminUser.get());
        }
    }
}
