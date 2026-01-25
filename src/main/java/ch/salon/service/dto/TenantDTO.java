package ch.salon.service.dto;

import java.util.UUID;

/**
 * DTO for tenant information returned to the client
 */
public record TenantDTO(
        UUID id,
        String name,
        String slug,
        boolean isOwner,
        String memberStatus) {
}
