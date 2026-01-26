package ch.salon.config;

import ch.salon.security.tenant.SalonCurrentTenantIdentifierResolver;
import org.hibernate.cfg.AvailableSettings;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * Hibernate multi-tenancy configuration using DISCRIMINATOR strategy.
 *
 * This configuration enables automatic tenant filtering for all @TenantId annotated fields.
 * When Hibernate loads entities with @TenantId, it automatically applies a WHERE clause
 * filtering by the current tenant (resolved by SalonCurrentTenantIdentifierResolver).
 *
 * This applies to:
 * - repository.findAll() / findById()
 * - JPQL/HQL queries
 * - Criteria API queries
 * - Lazy-loading associations
 * - Pagination and sorting
 *
 * IMPORTANT: In SYSTEM mode, CurrentTenantIdentifierResolver returns ROOT_TENANT_ID (00000000-0000-0000-0000-000000000000).
 * Since no actual TenantOwned entity should have this tenant_id value, queries in SYSTEM mode will return
 * empty results unless explicitly impersonating a tenant via TenantContextHolder.runAsTenant(tenantId, supplier).
 *
 * Configuration Details:
 * - Strategy: DISCRIMINATOR (uses database column-based isolation)
 * - Tenant Identifier Resolver: SalonCurrentTenantIdentifierResolver
 * - Applies to all entities implementing TenantOwned with @TenantId
 */
@Configuration
public class HibernateMultiTenancyConfiguration {

    /**
     * Customize Hibernate properties to enable multi-tenancy with DISCRIMINATOR strategy.
     * This bean is automatically picked up by Spring Boot's HibernateJpaConfiguration.
     */
    @Bean
    public HibernatePropertiesCustomizer hibernateMultiTenancyCustomizer(
            SalonCurrentTenantIdentifierResolver tenantResolver) {
        return hibernateProperties -> {
            // Set the current tenant identifier resolver
            hibernateProperties.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, tenantResolver);
        };
    }
}
