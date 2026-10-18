package ch.salon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

/**
 * Inscription à la liste d'attente de la plateforme (page d'accueil publique « e-salon »).
 * Entité globale, non rattachée à un tenant : la liste d'attente concerne la plateforme entière,
 * pas un salon en particulier.
 */
@Entity
@Table(name = "waitlist_entry")
@Data
public class WaitlistEntry extends AbstractAuditingEntity<UUID> implements Serializable {

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotBlank
    @Email
    @Column(name = "email", nullable = false, unique = true)
    private String email;
}

