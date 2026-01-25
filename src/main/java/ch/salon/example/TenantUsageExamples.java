/**
 * EXAMPLE: Using Multi-Tenancy in Your Application
 * <p>
 * This file shows common patterns for working with the multi-tenancy system.
 * File location: src/main/java/ch/salon/example/TenantUsageExamples.java
 */

package ch.salon.example;

import ch.salon.domain.Salon;
import ch.salon.domain.Tenant;
import ch.salon.repository.SalonRepository;
import ch.salon.repository.TenantRepository;
import ch.salon.security.tenant.TenantContextHolder;
import ch.salon.service.tenant.TenantProvisioningService;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Example usage patterns for multi-tenancy
 */
public class TenantUsageExamples {

    private final TenantProvisioningService tenantProvisioningService;
    private final SalonRepository salonRepository;
    private final TenantRepository tenantRepository;

    public TenantUsageExamples(TenantProvisioningService tenantProvisioningService,
                               SalonRepository salonRepository,
                               TenantRepository tenantRepository) {
        this.tenantProvisioningService = tenantProvisioningService;
        this.salonRepository = salonRepository;
        this.tenantRepository = tenantRepository;
    }

    // ============================================
    // EXAMPLE 1: Normal User Request (Automatic)
    // ============================================

    /**
     * This is how requests from authenticated users work.
     * The TenantFilter automatically handles context setup.
     *
     * Flow:
     * 1. User sends request with JWT
     * 2. TenantFilter loads user from DB and sets context
     * 3. Your controller/service code runs
     * 4. TenantFilter clears context after response
     *
     * Example REST Endpoint:
     */
    public void exampleUserController_createSalon() {
        // In a real @RestController method:
        // - User is authenticated (JWT token)
        // - TenantFilter has already set context
        // - You can access current tenant:

        UUID currentTenantId = TenantContextHolder.getCurrentTenantId();
        System.out.println("Current tenant: " + currentTenantId);

        // Create a new salon
        Salon salon = new Salon();
        salon.setPlace("Paris Exhibition Center");
        salon.setStartingDate(java.time.Instant.now());
        salon.setEndingDate(java.time.Instant.now());

        // NOTE: tenantId will be AUTO-SET by Hibernate listener!
        // You don't need to do: salon.setTenantId(currentTenantId);

        salonRepository.save(salon);
        // Result: salon.tenantId is automatically set to user's tenant
    }

    // ============================================
    // EXAMPLE 2: Create a New Tenant (Admin/System)
    // ============================================

    /**
     * Only administrators/internal code can create tenants.
     * This must run in SYSTEM mode.
     */
    @Transactional
    public void exampleCreateNewTenant() {
        // Wrap in SYSTEM mode
        TenantContextHolder.runAsSystem(() -> {

            // Create tenant with an owner
            UUID ownerUserId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");

            Tenant newTenant = tenantProvisioningService.createTenant(
                    "New Salon Organization",
                    "new-salon-org",
                    ownerUserId
            );

            System.out.println("Created tenant: " + newTenant.getId());
        });

        // Context is automatically cleared after runAsSystem block
    }

    // ============================================
    // EXAMPLE 3: Cron Job (Daily Maintenance)
    // ============================================

    /**
     * For background jobs that operate on each tenant
     */
    @Transactional
    public void exampleDailyMaintenanceJob() {
        // Start in SYSTEM mode to access all tenants
        TenantContextHolder.runAsSystem(() -> {

            // Get all tenants
            var allTenants = tenantRepository.findAll();
            System.out.println("Processing " + allTenants.size() + " tenants");

            // Process each tenant
            for (Tenant tenant : allTenants) {
                processTenant(tenant.getId());
            }
        });
    }

    /**
     * Process one tenant's data
     */
    private void processTenant(UUID tenantId) {
        // Switch to this tenant's context
        TenantContextHolder.runAsTenant(tenantId, () -> {

            System.out.println("Processing tenant: " + tenantId);

            // All queries and operations are now scoped to this tenant
            // Get current tenant's salons (as if you were a user of this tenant)
            // NOTE: This would require repository-level tenant filtering
            // For now, you manually scope your queries

            // Example: update all salons for this tenant
            // (In real code, you'd have a query that filters by tenant_id)

            System.out.println("Completed processing for tenant: " + tenantId);
        });

        // Context is automatically cleared after block
    }

    // ============================================
    // EXAMPLE 4: Assign User to Different Tenant
    // ============================================

    /**
     * Administratively assign a user to a tenant
     */
    @Transactional
    public void exampleAssignUserToTenant() {
        TenantContextHolder.runAsSystem(() -> {

            UUID userId = UUID.fromString("660e8400-e29b-41d4-a716-446655440000");
            UUID tenantId = UUID.fromString("a8d5c7e1-1234-5678-9abc-def012345678");

            tenantProvisioningService.assignUserToTenant(userId, tenantId, false);

            System.out.println("User " + userId + " assigned to tenant " + tenantId);
        });
    }

    // ============================================
    // EXAMPLE 5: Security Violations (What NOT to do)
    // ============================================

    /**
     * These examples show what will be prevented by the system
     */
    @Transactional
    public void exampleSecurityViolations() {
        UUID tenantA = UUID.fromString("a8d5c7e1-1234-5678-9abc-def012345678");
        UUID tenantB = UUID.fromString("b8d5c7e1-1234-5678-9abc-def012345678");

        // VIOLATION 1: Try to create entity with mismatched tenant
        TenantContextHolder.runAsTenant(tenantA, () -> {
            Salon salon = new Salon();
            salon.setPlace("Paris");
            salon.setTenantId(tenantB); // Wrong tenant!

            try {
                salonRepository.save(salon);
                // RESULT: SecurityException thrown by Hibernate listener
                // "Tenant mismatch on INSERT: entity has tenantId=B but context has tenantId=A"
            } catch (SecurityException e) {
                System.out.println("Prevented: " + e.getMessage());
            }
        });

        // VIOLATION 2: Try to change tenant on update
        TenantContextHolder.runAsTenant(tenantA, () -> {
            Salon existingSalon = salonRepository.findAll().get(0);
            existingSalon.setTenantId(tenantB); // Trying to move to different tenant!

            try {
                salonRepository.save(existingSalon);
                // RESULT: SecurityException thrown
                // "Tenant mismatch on UPDATE: entity has tenantId=B but context has tenantId=A"
            } catch (SecurityException e) {
                System.out.println("Prevented: " + e.getMessage());
            }
        });

        // VIOLATION 3: User tries to create tenant
        TenantContextHolder.runAsTenant(tenantA, () -> {
            try {
                // This service requires SYSTEM mode
                tenantProvisioningService.createTenant("Hacked Tenant", "hacked", null);
                // RESULT: IllegalStateException
                // "createTenant must be called in SYSTEM mode"
            } catch (IllegalStateException e) {
                System.out.println("Prevented: " + e.getMessage());
            }
        });
    }

    // ============================================
    // EXAMPLE 6: Advanced: Execute with Result
    // ============================================

    /**
     * Return a value from tenant context
     */
    @Transactional
    public void exampleExecuteWithResult() {
        UUID tenantId = UUID.fromString("a8d5c7e1-1234-5678-9abc-def012345678");

        // Execute operation and get result
        Long salonCount = TenantContextHolder.runAsTenant(tenantId, () -> {
            // Query current tenant's salons
            return salonRepository.count();
        });

        System.out.println("Tenant has " + salonCount + " salons");
    }
}
