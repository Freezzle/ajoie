package ch.salon.config;

import org.springframework.stereotype.Component;

/**
 * Utility for detecting potentially dangerous native SQL queries on multi-tenant entities.
 *
 * This class provides helper methods to flag native SQL usage on TenantOwned entities.
 * Use in code reviews and tests to prevent data leaks.
 *
 * RULE: Never use nativeQuery=true on TenantOwned entities unless:
 * 1. The query includes WHERE tenant_id = ? predicate, OR
 * 2. The query operates on the Tenant table (not tenant-owned)
 *
 * Examples of DANGEROUS patterns:
 * - @Query(value = "SELECT * FROM salon WHERE ...", nativeQuery = true)
 * - EntityManager.createNativeQuery("SELECT * FROM invoice WHERE ...")
 *
 * Examples of SAFE patterns:
 * - @Query("SELECT s FROM Salon s WHERE ...") // HQL - auto-filtered
 * - @Query(value = "SELECT * FROM salon WHERE tenant_id = ? AND place = ?", nativeQuery = true)
 * - repository.findAll() // Spring Data JPA - auto-filtered
 */
@Component
public class TenantQueryAuditHelper {

    /**
     * Tenant-owned entities that must be filtered by tenant_id
     */
    private static final String[] TENANT_OWNED_TABLES = {
            "salon",
            "jhi_user",
            "stand",
            "workshop",
            "conference",
            "chat_message",
            "chat_conversation",
            "event_log",
            "exhibitor",
            "floor_plan_salon",
            "invoice",
            "invoicing_plan",
            "address",
            "price_stand_salon",
            "salon_talk_planning",
            "payment",
            "participation"
    };

    /**
     * System/non-tenant-owned tables that are safe in native queries
     */
    private static final String[] SAFE_SYSTEM_TABLES = {
            "tenant",
            "jhi_authority",
            "jhi_user_authority",
            "persistent_token"
    };

    /**
     * Check if a native SQL query is safe by verifying it includes tenant_id predicate.
     * This is a static analysis helper - not a runtime check.
     *
     * @param sql the SQL query text
     * @param tableName the table being queried
     * @return true if query appears safe, false if potentially dangerous
     */
    public boolean isNativeQuerySafe(String sql, String tableName) {
        // Check if table is system table (safe)
        for (String safeTable : SAFE_SYSTEM_TABLES) {
            if (tableName.equalsIgnoreCase(safeTable)) {
                return true; // System table is always safe
            }
        }

        // Check if table is tenant-owned
        boolean isTenantOwned = false;
        for (String tenantTable : TENANT_OWNED_TABLES) {
            if (tableName.equalsIgnoreCase(tenantTable)) {
                isTenantOwned = true;
                break;
            }
        }

        // If tenant-owned, must have tenant_id filter
        if (isTenantOwned) {
            String upperSql = sql.toUpperCase();
            // Look for tenant_id filter in WHERE clause
            boolean hasTenantFilter = upperSql.contains("TENANT_ID");
            if (!hasTenantFilter) {
                return false; // Dangerous: tenant-owned table without tenant_id filter
            }
        }

        return true; // Either system table or has tenant filter
    }

    /**
     * Generate warning message for dangerous native query
     */
    public static String getDangerousQueryWarning(String tableName) {
        return String.format(
                "SECURITY WARNING: Native query on tenant-owned table '%s' detected without tenant_id filter. " +
                        "This may leak data across tenants. " +
                        "Either: (1) Convert to HQL/JPQL, OR (2) Add WHERE tenant_id = ? predicate, OR " +
                        "(3) Use Spring Data JPA repository methods (auto-filtered). " +
                        "See MULTITENANCY_GUIDE.md for details.",
                tableName
        );
    }

    /**
     * Audit hint for repository developers
     */
    public static String getRepositoryDevelopmentHint() {
        return """
                MULTI-TENANCY BEST PRACTICES FOR REPOSITORIES:
                
                ✓ GOOD - Uses HQL (auto-filtered):
                  @Query("SELECT s FROM Salon s WHERE s.place = :place")
                
                ✓ GOOD - Uses Spring Data JPA (auto-filtered):
                  List<Salon> findByPlace(String place);
                  Page<Salon> findAll(Pageable pageable);
                
                ✓ GOOD - Native query with tenant_id filter:
                  @Query(value = "SELECT * FROM salon WHERE tenant_id = ? AND place = ?", 
                         nativeQuery = true)
                
                ✗ BAD - Native query without tenant_id:
                  @Query(value = "SELECT * FROM salon WHERE place = ?", nativeQuery = true)
                
                For complex queries, prefer Specifications over native SQL:
                  repository.findAll(salonSpecifications.byPlace("Paris"))
                """;
    }
}
