package ch.salon.security.tenant;

/**
 * Exception thrown when tenant context is missing or invalid
 */
public class TenantContextMissingException extends RuntimeException {
    public TenantContextMissingException(String message) {
        super(message);
    }

    public TenantContextMissingException(String message, Throwable cause) {
        super(message, cause);
    }
}
