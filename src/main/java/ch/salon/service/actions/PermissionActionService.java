package ch.salon.service.actions;

import ch.salon.security.AuthoritiesConstants;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

@Service
public class PermissionActionService {
    public boolean isAllowed(String actionCode, Object entity, Authentication authentication) {

        if (authentication.getAuthorities()
                          .stream()
                          .map(GrantedAuthority::getAuthority)
                          .anyMatch(a -> a.equals(AuthoritiesConstants.ADMIN) ||
                                         a.equals(AuthoritiesConstants.ADMIN_BUSINESS))) {
            return true;
        }

        return false;
    }
}
