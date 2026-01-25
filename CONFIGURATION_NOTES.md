# Configuration Notes for Multi-Tenancy

## Application Properties

No additional Spring configuration properties are required. The system is self-contained and auto-configured.

However, for debugging, you may want to enable:

### development/application-dev.yml
```yaml
# Enable SQL logging to verify tenant_id is being set
spring:
  jpa:
    show-sql: true
    properties:
      hibernate:
        format_sql: true
        use_sql_comments: true
        
# Enable debug logging for tenant components
logging:
  level:
    ch.salon.security.tenant: DEBUG
    ch.salon.domain.listener: DEBUG
    ch.salon.config: DEBUG
```

### production/application-prod.yml
```yaml
# Disable SQL logging in production
spring:
  jpa:
    show-sql: false
    
# Use INFO level in production
logging:
  level:
    ch.salon.security.tenant: INFO
    ch.salon.domain.listener: INFO
    ch.salon.config: INFO
```

## Spring Boot Auto-Configuration

The following are automatically enabled (no configuration needed):

### Component Scanning
- ✅ All @Component, @Service, @Repository classes are auto-discovered
- ✅ No need to explicitly import configuration classes

### Persistence
- ✅ Hibernate is configured via spring.jpa.hibernate properties
- ✅ HibernateListenerConfiguration is auto-discovered
- ✅ TenantEnforcementListener is registered at SessionFactory creation

### Filtering
- ✅ TenantFilter is auto-registered in filter chain
- ✅ Extends OncePerRequestFilter (automatically added to chain)

### Scheduling
- ✅ @EnableScheduling is on SchedulingConfiguration
- ✅ @Scheduled methods auto-discovered

## Database Configuration

### Liquibase
- All migrations automatically run on startup
- Order matters: initial schema → then 0.0.2/0.0.2_master.xml → which includes 0.0.2_202601-tenant.xml

### Connection Pooling
No special requirements. Standard HikariCP configuration applies.

### Transactions
- @Transactional is used on service methods
- TenantContextHolder lifecycle is bound to thread (request-scoped)
- Context is cleared before transaction commit

## Security Configuration Integration

The TenantFilter is added to the filter chain via Spring's filter registration.

If you encounter issues, verify in SecurityConfiguration:
- TenantFilter is before the main security filter chain
- Or: TenantFilter is after JWT decoding but before authorization

### Current Integration
- TenantFilter extends OncePerRequestFilter
- Spring Boot auto-registers all OncePerRequestFilter beans
- Processes after Spring Security

## Known Limitations

### 1. Read-Layer Not Filtered
- Queries return all rows by default
- Business logic must respect tenant context
- Future: Add repository-level tenant filtering

### 2. User.id is Long (Legacy)
- JWT might reference user as UUID or String
- TenantFilter handles conversion

### 3. No API Versioning
- Single /api/tenant/me endpoint
- Future: Support /api/tenants/{slug}/resource

## Performance Considerations

### Indexes
- All tenant_id columns are indexed
- Query performance should not be affected
- Plan capacity based on tenant count

### Caching
- SecurityContext is cached
- Tenant context is NOT cached (created per request)
- Consider caching user→tenant mapping if needed

### Event Listener
- Hibernate listener runs on every INSERT/UPDATE
- Minimal overhead (just checking context)
- No N+1 problems introduced

## Monitoring

### Metrics to Track
- Request latency (should be unchanged)
- Hibernate listener invocation count
- TenantContextHolder.clear() success rate
- Cross-tenant access attempts (should be zero)

### Logging to Monitor
```
# Watch for these messages:
"Set tenant context for user"  # Normal request
"Tenant context cleared"        # Normal cleanup
"Tenant mismatch"               # ALERT - security violation attempt
"No tenant context available"   # User not authenticated
```

## Troubleshooting Configuration

### Issue: TenantFilter not running
**Solution:** Ensure class extends OncePerRequestFilter and is @Component

### Issue: Context not set
**Solution:** Verify SecurityUtils.getCurrentUserLogin() is working

### Issue: Listener not registered
**Solution:** Check HibernateListenerConfiguration has @Component and @PostConstruct

### Issue: Migrations not running
**Solution:** Verify Liquibase paths in application.yml

## Integration with Existing Configuration

No conflicts with existing Spring Boot configuration:
- No bean name collisions
- No property overrides
- No initialization order issues

## Notes for DevOps

### Environment Variables
None required for multi-tenancy. Standard Spring Boot vars apply:
- SPRING_DATASOURCE_URL
- SPRING_DATASOURCE_USERNAME
- SPRING_DATASOURCE_PASSWORD
- SPRING_JPA_HIBERNATE_DDL_AUTO (should be "validate" in prod)

### Container/Docker
No special configuration needed.
Multi-tenancy works on all platforms (same code path).

### Kubernetes/Cloud
ThreadLocal works fine in containerized environments.
No special affinity or session settings needed.

## Rollback Procedure

If you need to remove multi-tenancy:

1. **Revert database:**
   - Remove 0.0.2_202601-tenant.xml from Liquibase
   - Migrations will reverse on next run

2. **Remove code:**
   - Delete tenant-related packages
   - Remove TenantOwned implementation from entities
   - Remove TenantFilter from filter chain

3. **Update entities:**
   - Remove tenant_id fields
   - Remove TenantOwned implementations

**Important:** Perform reversal in opposite order of implementation!

## Support & Debugging

### Enable Full Debug Logging
```yaml
logging:
  level:
    ch.salon: DEBUG
    org.hibernate.event.internal: DEBUG
    org.springframework.security: DEBUG
```

### Verify Setup
Run: `SQL_VERIFICATION_SCRIPT.sql`

### Check Logs
Look for:
- TenantBootstrap startup messages
- TenantFilter tenant context messages
- HibernateListenerConfiguration registration

### Common Commands
```bash
# Check if default tenant exists
psql -d salon_db -c "SELECT * FROM tenant;"

# Check user tenant assignments
psql -d salon_db -c "SELECT login, tenant_id, tenant_owner FROM jhi_user LIMIT 5;"

# Check for NULL tenant_ids
psql -d salon_db -c "SELECT table_name, COUNT(*) FROM salon WHERE tenant_id IS NULL GROUP BY table_name;"
```
