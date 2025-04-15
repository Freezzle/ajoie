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
import java.time.Instant;
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
    @Column(name = "title",
            nullable = false)
    private String title;

    @NotNull
    @Column(name = "description",
            nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    @Column(name = "extra_information")
    private String extraInformation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = {"exhibitor", "salon"},
                          allowSetters = true)
    private Participation participation;

    @Column(name = "registration_date")
    private Instant registrationDate;

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Instant getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(Instant registrationDate) {
        this.registrationDate = registrationDate;
    }

    public Conference id(UUID id) {
        this.setId(id);
        return this;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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

    public static boolean diffStatus(Conference conf1, Conference conf2) {
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
        return ("Conference{" + "id=" + id + ", title='" + title + '\'' + ", description='" + description + '\'' +
                ", status=" + status + ", extraInformation='" + extraInformation + '\'' + ", participation=" +
                participation + '}');
    }
}
