package ch.salon.security.tenant;

import java.util.Optional;
import java.util.UUID;

/**
 * Holds the current tenant context for the ongoing request or operation.
 * Uses ThreadLocal to store tenant information.
 * Contexts: SYSTEM (for admin operations) or TENANT (for user operations).
 */
public class TenantContextHolder {

    public enum Mode {
        SYSTEM,
        TENANT
    }

    private static final ThreadLocal<TenantContext> contextHolder = new ThreadLocal<>();

    public static class TenantContext {
        private final Mode mode;
        private final UUID tenantId;
        private final Long userId;

        private TenantContext(Mode mode, UUID tenantId, Long userId) {
            this.mode = mode;
            this.tenantId = tenantId;
            this.userId = userId;
        }

        public Mode getMode() {
            return mode;
        }

        public UUID getTenantId() {
            return tenantId;
        }

        public Optional<Long> getUserId() {
            return Optional.ofNullable(userId);
        }

        public boolean isSystem() {
            return mode == Mode.SYSTEM;
        }

        public boolean isTenant() {
            return mode == Mode.TENANT;
        }
    }

    /**
     * Get the current tenant context
     */
    public static Optional<TenantContext> getContext() {
        return Optional.ofNullable(contextHolder.get());
    }

    /**
     * Get the current tenant ID (throws if not in TENANT mode or context is null)
     */
    public static UUID getCurrentTenantId() {
        return getContext()
                .filter(TenantContext::isTenant)
                .map(TenantContext::getTenantId)
                .orElseThrow(() -> new IllegalStateException("No tenant context available or not in TENANT mode"));
    }

    /**
     * Get the current user ID if available
     */
    public static Optional<Long> getCurrentUserId() {
        return getContext().flatMap(TenantContext::getUserId);
    }

    /**
     * Check if we're in SYSTEM mode
     */
    public static boolean isSystemMode() {
        return getContext().map(TenantContext::isSystem).orElse(false);
    }

    /**
     * Check if we're in TENANT mode
     */
    public static boolean isTenantMode() {
        return getContext().map(TenantContext::isTenant).orElse(false);
    }

    /**
     * Set context to SYSTEM mode
     */
    public static void setSystemMode() {
        contextHolder.set(new TenantContext(Mode.SYSTEM, null, null));
    }

    /**
     * Set context to TENANT mode with given tenant ID
     */
    public static void setTenantMode(UUID tenantId) {
        setTenantMode(tenantId, null);
    }

    /**
     * Set context to TENANT mode with given tenant ID and user ID
     */
    public static void setTenantMode(UUID tenantId, Long userId) {
        if (tenantId == null) {
            throw new IllegalArgumentException("tenantId cannot be null in TENANT mode");
        }
        contextHolder.set(new TenantContext(Mode.TENANT, tenantId, userId));
    }

    /**
     * Clear the current context
     */
    public static void clear() {
        contextHolder.remove();
    }

    /**
     * Run a supplier in SYSTEM mode, ensuring context is cleared afterwards
     */
    public static <T> T runAsSystem(java.util.function.Supplier<T> supplier) {
        try {
            setSystemMode();
            return supplier.get();
        } finally {
            clear();
        }
    }

    /**
     * Run a runnable in SYSTEM mode, ensuring context is cleared afterwards
     */
    public static void runAsSystem(Runnable runnable) {
        try {
            setSystemMode();
            runnable.run();
        } finally {
            clear();
        }
    }

    /**
     * Run a supplier in TENANT mode for the given tenant ID, ensuring context is cleared afterwards
     */
    public static <T> T runAsTenant(UUID tenantId, java.util.function.Supplier<T> supplier) {
        return runAsTenant(tenantId, null, supplier);
    }

    /**
     * Run a supplier in TENANT mode for the given tenant ID and user ID, ensuring context is cleared afterwards
     */
    public static <T> T runAsTenant(UUID tenantId, Long userId, java.util.function.Supplier<T> supplier) {
        try {
            setTenantMode(tenantId, userId);
            return supplier.get();
        } finally {
            clear();
        }
    }

    /**
     * Run a runnable in TENANT mode for the given tenant ID, ensuring context is cleared afterwards
     */
    public static void runAsTenant(UUID tenantId, Runnable runnable) {
        runAsTenant(tenantId, null, runnable);
    }

    /**
     * Run a runnable in TENANT mode for the given tenant ID and user ID, ensuring context is cleared afterwards
     */
    public static void runAsTenant(UUID tenantId, Long userId, Runnable runnable) {
        try {
            setTenantMode(tenantId, userId);
            runnable.run();
        } finally {
            clear();
        }
    }
}
