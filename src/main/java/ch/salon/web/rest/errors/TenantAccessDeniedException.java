package ch.salon.web.rest.errors;

/**
 * Exception thrown when a user attempts to access tenant data of another tenant
 */
public class TenantAccessDeniedException extends RuntimeException {
    public TenantAccessDeniedException(String message) {
        super(message);
    }

    public TenantAccessDeniedException(String message, Throwable cause) {
        super(message, cause);
    }
}
