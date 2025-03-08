package ch.salon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "volunteer_availability")
public class VolunteerAvailability {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @ManyToOne(optional = false)
    private Volunteer volunteer;

    @ManyToOne(optional = false)
    private TimeSlot timeSlot;

    @Column(name = "category")
    private String category;

    public VolunteerAvailability() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Volunteer getVolunteer() {
        return volunteer;
    }

    public void setVolunteer(Volunteer volunteer) {
        this.volunteer = volunteer;
    }

    public TimeSlot getTimeSlot() {
        return timeSlot;
    }

    public void setTimeSlot(TimeSlot timeSlot) {
        this.timeSlot = timeSlot;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        VolunteerAvailability that = (VolunteerAvailability) o;
        return Objects.equals(id, that.id) && Objects.equals(volunteer, that.volunteer) &&
               Objects.equals(timeSlot, that.timeSlot);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, volunteer, timeSlot);
    }

    @Override
    public String toString() {
        return "VolunteerAvailability{" + "id=" + id + ", volunteer=" + volunteer + ", timeSlot=" + timeSlot + '}';
    }
}
