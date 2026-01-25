package ch.salon.security.tenant;

import ch.salon.domain.User;
import ch.salon.repository.UserRepository;
import ch.salon.security.SecurityUtils;
import jakarta.persistence.EntityManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

/**
 * Filter that sets up the tenant context for each request.
 * Reads the authenticated user from SecurityContext and loads their tenant_id from the database.
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
                // Load the user from DB to get their tenant_id
                Optional<User> user = userRepository.findOneByLogin(userLogin.get());

                if (user.isPresent() && user.get().getTenantId() != null) {
                    // Set the tenant context for this request
                    UUID tenantId = user.get().getTenantId();

                    try {
                        TenantContextHolder.setTenantMode(tenantId, user.get().getId());
                    } catch (NumberFormatException e) {
                        // If User.id is not a UUID in old schema, just use tenantId
                        TenantContextHolder.setTenantMode(tenantId);
                    }
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            // Always clear the context after the request
            TenantContextHolder.clear();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        // Don't filter unauthenticated requests (security, register, etc.)
        return !SecurityUtils.isAuthenticated();
    }
}
