package ch.salon.domain;

import ch.salon.domain.enumeration.Status;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "conference")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Conference implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    @Column(name = "extra_information")
    private String extraInformation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = { "exhibitor", "salon" }, allowSetters = true)
    private Participation participation;

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Conference id(UUID id) {
        this.setId(id);
        return this;
    }

    public String getTitle() {
        return this.title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Conference title(String title) {
        this.setTitle(title);
        return this;
    }

    public Status getStatus() {
        return this.status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Conference status(Status status) {
        this.setStatus(status);
        return this;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Conference extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    public Participation getParticipation() {
        return this.participation;
    }

    public void setParticipation(Participation participation) {
        this.participation = participation;
    }

    public Conference participation(Participation participation) {
        this.setParticipation(participation);
        return this;
    }

    public static boolean hasDifference(Conference conf1, Conference conf2) {
        return (
            (conf1 == null && conf2 != null) ||
            (conf1 != null && conf2 == null) ||
            (conf1 != null && conf2 != null && (!Objects.equals(conf1.getStatus(), conf2.getStatus())))
        );
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Conference)) {
            return false;
        }
        return getId() != null && getId().equals(((Conference) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return (
            "Conference{" +
            "id=" +
            getId() +
            ", title='" +
            getTitle() +
            "'" +
            ", status='" +
            getStatus() +
            "'" +
            ", extraInformation='" +
            getExtraInformation() +
            "'" +
            "}"
        );
    }
}
