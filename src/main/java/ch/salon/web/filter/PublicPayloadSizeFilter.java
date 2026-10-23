package ch.salon.web.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Rejette très tôt les corps de requête anormalement volumineux sur les endpoints publics anonymes,
 * avant toute désérialisation JSON.
 * <p>
 * Ces endpoints acceptent des images encodées en base64 : sans cette borne, un client anonyme
 * pourrait faire buffériser des charges utiles arbitrairement grandes.
 */
public class PublicPayloadSizeFilter extends OncePerRequestFilter {

    /**
     * Deux images d'1 Mo en base64 (~1,4 Mo chacune) plus le reste du formulaire.
     */
    public static final long MAX_PUBLIC_PAYLOAD_BYTES = 4L * 1024 * 1024;

    private static final String PUBLIC_PREFIX = "/api/public/";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (request.getContentLengthLong() > MAX_PUBLIC_PAYLOAD_BYTES) {
            response.sendError(HttpStatus.PAYLOAD_TOO_LARGE.value(), "Payload too large");
            return;
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith(PUBLIC_PREFIX);
    }
}
