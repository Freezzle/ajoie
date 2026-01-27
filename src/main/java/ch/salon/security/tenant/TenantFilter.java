package ch.salon.security.tenant;

import ch.salon.domain.User;
import ch.salon.repository.UserRepository;
import ch.salon.security.SecurityUtils;
import jakarta.persistence.EntityManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

/**
 * Filter that sets up the tenant context for each request.
 * Reads the authenticated user from SecurityContext and loads their tenant_id from the database.
 *
 * Flow:
 * 1. If user is authenticated: Load user from DB and set TENANT mode with their tenant_id
 * 2. If user is NOT authenticated: Set SYSTEM mode (uses ROOT_TENANT_ID)
 * - This allows requests to proceed without blocking
 * - But endpoint-level security should prevent access to protected resources
 * - Public endpoints (login, register, etc.) can proceed normally
 */
@Component
public class TenantFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(TenantFilter.class);
    private final UserRepository userRepository;
    private final EntityManager entityManager;

    public TenantFilter(UserRepository userRepository, EntityManager entityManager) {
        this.userRepository = userRepository;
        this.entityManager = entityManager;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            // Try to extract user login from JWT/SecurityContext
            Optional<String> userLogin = SecurityUtils.getCurrentUserLogin();

            if (userLogin.isPresent()) {
                String userLoginStr = userLogin.orElseThrow();
                // User is authenticated: Load the user from DB to get their tenant_id
                try {
                    User user = userRepository.findOneByLogin(userLoginStr).orElseThrow();
                    if (user.getTenantId() != null) {
                        // Set the tenant context for this request
                        try {
                            TenantContextHolder.setTenantMode(user.getTenantId(), user.getId());
                        } catch (NumberFormatException e) {
                            // If User.id is not a UUID in old schema, just use tenantId
                            TenantContextHolder.setTenantMode(user.getTenantId());
                        }
                        logger.debug("Set TENANT context for user {} with tenant {}", userLoginStr, user.getTenantId());
                    } else {
                        // User is authenticated but has no tenant assigned
                        logger.warn("Authenticated user {} has no tenant assigned", userLoginStr);
                        TenantContextHolder.setSystemMode();
                    }
                } catch (java.util.NoSuchElementException e) {
                    // User not found in DB
                    logger.warn("Authenticated user {} not found in database", userLoginStr);
                    TenantContextHolder.setSystemMode();
                }
            } else {
                // User is NOT authenticated: Set SYSTEM mode with ROOT_TENANT_ID
                // This allows public endpoints to work without authentication
                // (e.g., login, register, password reset, etc.)
                TenantContextHolder.setSystemMode();
                logger.debug("No authentication found - using SYSTEM mode");
            }

            filterChain.doFilter(request, response);
        } finally {
            // Always clear the context after the request
            TenantContextHolder.clear();
        }
    }

    // Don't override shouldNotFilter - we want to filter all requests
    // to ensure tenant context is always properly set
}
