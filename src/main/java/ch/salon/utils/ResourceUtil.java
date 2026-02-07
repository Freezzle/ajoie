package ch.salon.utils;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;

/**
 * Utility class for building REST responses with standardized headers.
 * Provides a fluent API for creating, updating and deleting resources.
 */
@Slf4j
@Component
public class ResourceUtil {

    private static String applicationName;

    @Value("${salon.clientApp.name}")
    public void setApplicationName(String name) {
        ResourceUtil.applicationName = name;
    }

    private ResourceUtil() {
    }

    /**
     * Creates a ResponseEntity builder for a created resource with appropriate headers.
     * Builds the URI from the provided base path + id.
     *
     * @param entityName the name of the entity type
     * @param id the identifier of the created resource
     * @param basePath the base path for the resource (e.g., "/api/admin/exhibitors")
     * @return a ResponseEntity.BodyBuilder with 201 Created status and headers
     */
    public static ResponseEntity.BodyBuilder created(String entityName, Object id, String basePath) {
        URI location;
        try {
            location = new URI(basePath + "/" + id);
        } catch (Exception e) {
            log.error("Error creating URI from basePath: {} and id: {}", basePath, id, e);
            location = URI.create("");
        }

        HttpHeaders headers = HeaderUtil.createEntityCreationAlert(
                applicationName,
                true,
                entityName,
                id.toString()
        );
        return ResponseEntity.created(location).headers(headers);
    }

    /**
     * Creates a ResponseEntity builder for an updated resource with appropriate headers.
     *
     * @param entityName the name of the entity type
     * @param id the identifier of the updated resource
     * @return a ResponseEntity.BodyBuilder with 200 OK status and headers
     */
    public static ResponseEntity.BodyBuilder updated(String entityName, Object id) {
        HttpHeaders headers = HeaderUtil.createEntityUpdateAlert(
            applicationName,
            true,
            entityName,
            id.toString()
        );
        return ResponseEntity.ok().headers(headers);
    }

    /**
     * Creates a ResponseEntity builder for a deleted resource with appropriate headers.
     *
     * @param entityName the name of the entity type
     * @param id the identifier of the deleted resource
     * @return a ResponseEntity.HeadersBuilder with 204 No Content status and headers
     */
    public static ResponseEntity.HeadersBuilder<?> deleted(String entityName, Object id) {
        HttpHeaders headers = HeaderUtil.createEntityDeletionAlert(
            applicationName,
            true,
            entityName,
            id.toString()
        );
        return ResponseEntity.noContent().headers(headers);
    }


    // TO REMOVE LATER
    public static ResponseEntity.BodyBuilder updatedWithAlert(String message, String param) {
        HttpHeaders headers = HeaderUtil.createAlert(applicationName, message, param);
        return ResponseEntity.ok().headers(headers);
    }
}
