package ch.salon.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "volunteer")
public class Volunteer {

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @Column(name = "lastname")
    private String lastname;
    @Column(name = "firstname")
    private String firstname;
    @Column(name = "email")
    private String email;
    @Column(name = "phone_number")
    private String phoneNumber;

    public Volunteer() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getLastname() {
        return lastname;
    }

    public void setLastname(String lastname) {
        this.lastname = lastname;
    }

    public String getFirstname() {
        return firstname;
    }

    public void setFirstname(String firstname) {
        this.firstname = firstname;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        Volunteer volunteer = (Volunteer) o;
        return Objects.equals(id, volunteer.id) && Objects.equals(lastname, volunteer.lastname) &&
               Objects.equals(firstname, volunteer.firstname) && Objects.equals(email, volunteer.email) &&
               Objects.equals(phoneNumber, volunteer.phoneNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, lastname, firstname, email, phoneNumber);
    }

    @Override
    public String toString() {
        return "Volunteer{" + "id=" + id + ", lastname='" + lastname + '\'' + ", firstname='" + firstname + '\'' +
               ", email='" + email + '\'' + ", phoneNumber='" + phoneNumber + '\'' + '}';
    }
}
