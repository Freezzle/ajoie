package ch.salon.security.tenant;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Utility for executing code blocks within a transaction while preserving the current tenant context.
 *
 * This pattern solves the multi-tenant transaction initialization problem:
 * - @Transactional on async methods creates transactions BEFORE tenantId is in context
 * - This utility ensures transactions are created AFTER tenantId is established
 *
 * Usage (in async handlers or any context where tenant context is already set):
 *
 *   @Async
 *   public void sendEmailAsync(UUID tenantId, ...) {
 *       TenantContextHolder.runAsTenant(tenantId, () -> {
 *           this.transactionalOps.execute(() -> {
 *               // This code runs in a transaction with tenantId in context
 *               repository.save(entity);
 *               eventLogService.eventFromSystem(...); // tenantId is available
 *           });
 *       });
 *   }
 *
 * Or if tenantId is already in context (from request filter or runAsTenant):
 *
 *   this.transactionalOps.execute(() -> {
 *       repository.save(entity);
 *       eventLogService.eventFromSystem(...);
 *   });
 */
@Component
public class TransactionalTenantOperation {

    /**
     * Execute a code block within a transaction, using the current tenant context.
     *
     * @param operation The runnable to execute (typically a lambda with business logic)
     */
    @Transactional
    public void execute(Runnable operation) {
        operation.run();
    }

    /**
     * Execute a code block within a transaction and return a result, using the current tenant context.
     *
     * @param <T> The return type
     * @param supplier The supplier to execute (typically a lambda that returns a value)
     * @return The result from the supplier
     */
    @Transactional
    public <T> T executeAndReturn(java.util.function.Supplier<T> supplier) {
        return supplier.get();
    }

    /**
     * Execute a code block within a read-only transaction, using the current tenant context.
     * Useful for queries that should not modify data.
     *
     * @param operation The runnable to execute
     */
    @Transactional(readOnly = true)
    public void executeReadOnly(Runnable operation) {
        operation.run();
    }

    /**
     * Execute a code block within a read-only transaction and return a result.
     *
     * @param <T> The return type
     * @param supplier The supplier to execute
     * @return The result from the supplier
     */
    @Transactional(readOnly = true)
    public <T> T executeReadOnlyAndReturn(java.util.function.Supplier<T> supplier) {
        return supplier.get();
    }
}
