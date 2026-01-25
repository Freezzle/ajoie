package ch.salon.web.rest.errors;

import ch.salon.security.tenant.TenantContextMissingException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.context.request.WebRequest;

import java.net.URI;

/**
 * Global exception handler for tenant-related errors
 */
@ControllerAdvice
public class TenantExceptionHandler {

    private static final URI TENANT_CONTEXT_MISSING_TYPE = URI.create(ErrorConstants.DEFAULT_TYPE + "#tenant-context-missing");
    private static final URI TENANT_ACCESS_DENIED_TYPE = URI.create(ErrorConstants.DEFAULT_TYPE + "#tenant-access-denied");
    private static final URI SECURITY_VIOLATION_TYPE = URI.create(ErrorConstants.DEFAULT_TYPE + "#security-violation");

    /**
     * Handle TenantContextMissingException
     * Returns 401 Unauthorized when tenant context is missing
     */
    @ExceptionHandler(TenantContextMissingException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<ProblemDetail> handleTenantContextMissing(
            TenantContextMissingException ex,
            WebRequest request) {

        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        problemDetail.setType(TENANT_CONTEXT_MISSING_TYPE);
        problemDetail.setTitle("Tenant context missing");
        problemDetail.setDetail(ex.getMessage());

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problemDetail);
    }

    /**
     * Handle TenantAccessDeniedException
     * Returns 403 Forbidden when user tries to access another tenant's data
     */
    @ExceptionHandler(TenantAccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<ProblemDetail> handleTenantAccessDenied(
            TenantAccessDeniedException ex,
            WebRequest request) {

        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        problemDetail.setType(TENANT_ACCESS_DENIED_TYPE);
        problemDetail.setTitle("Tenant access denied");
        problemDetail.setDetail(ex.getMessage());

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(problemDetail);
    }

    /**
     * Handle SecurityException (from Hibernate event listener)
     * Returns 403 Forbidden
     */
    @ExceptionHandler(SecurityException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<ProblemDetail> handleSecurityException(
            SecurityException ex,
            WebRequest request) {

        ProblemDetail problemDetail = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        problemDetail.setType(SECURITY_VIOLATION_TYPE);
        problemDetail.setTitle("Security violation");
        problemDetail.setDetail(ex.getMessage());

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(problemDetail);
    }
}
