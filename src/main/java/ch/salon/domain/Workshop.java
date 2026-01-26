package ch.salon.domain;

import ch.salon.domain.enumeration.Status;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.TenantId;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "workshop")
@Data
public class Workshop implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @NotNull
    @Column(name = "description", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    @Column(name = "extra_information")
    private String extraInformation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = {"exhibitor", "salon"}, allowSetters = true)
    private Participation participation;

    @Column(name = "registration_date")
    private Instant registrationDate;

    public static boolean diffStatus(Workshop conf1, Workshop conf2) {
        if (conf1 == null && conf2 != null) {
            return true;
        }
        if (conf1 != null && conf2 == null) {
            return true;
        }
        if (conf1 != null && conf2 != null) {
            return !Objects.equals(conf1.getStatus(), conf2.getStatus());
        }
        return false;
    }
}
