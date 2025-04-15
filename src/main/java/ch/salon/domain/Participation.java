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

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "participation")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Participation implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @Column(name = "client_number")
    private String clientNumber;

    @Column(name = "therapist_name",
            nullable = false)
    private String therapistName;

    @Column(name = "registration_date")
    private Instant registrationDate;

    @Column(name = "nb_meal_1")
    private Long nbMeal1;

    @Column(name = "nb_meal_2")
    private Long nbMeal2;

    @Column(name = "nb_meal_3")
    private Long nbMeal3;

    @Column(name = "accepted_chart")
    private Boolean acceptedChart;

    @Column(name = "accepted_contract")
    private Boolean acceptedContract;

    @Column(name = "need_arrangement")
    private Boolean needArrangement;

    @Column(name = "has_offer")
    private Boolean hasOffer;

    @Column(name = "offer")
    private String offer;

    @Column(name = "additional_information")
    private String additionnalInformation;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    @Column(name = "guest_of_honor")
    private Boolean guestOfHonor;

    @Column(name = "crush_of_heart")
    private Boolean crushOfHeart;

    @Column(name = "extra_information")
    private String extraInformation;

    @ManyToOne(fetch = FetchType.EAGER)
    private Exhibitor exhibitor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = {"priceStandSalons"},
                          allowSetters = true)
    private Salon salon;

    public UUID getId() {
        return this.id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Participation id(UUID id) {
        this.setId(id);
        return this;
    }

    public String getTherapistName() {
        return therapistName;
    }

    public void setTherapistName(String therapistName) {
        this.therapistName = therapistName;
    }


    public Instant getRegistrationDate() {
        return this.registrationDate;
    }

    public void setRegistrationDate(Instant registrationDate) {
        this.registrationDate = registrationDate;
    }

    public Participation registrationDate(Instant registrationDate) {
        this.setRegistrationDate(registrationDate);
        return this;
    }

    public Long getNbMeal1() {
        return this.nbMeal1;
    }

    public void setNbMeal1(Long nbMeal1) {
        this.nbMeal1 = nbMeal1;
    }

    public Participation nbMeal1(Long nbMeal1) {
        this.setNbMeal1(nbMeal1);
        return this;
    }

    public String getOffer() {
        return offer;
    }

    public void setOffer(String offer) {
        this.offer = offer;
    }

    public String getAdditionnalInformation() {
        return additionnalInformation;
    }

    public void setAdditionnalInformation(String additionnalInformation) {
        this.additionnalInformation = additionnalInformation;
    }

    public Long getNbMeal2() {
        return this.nbMeal2;
    }

    public void setNbMeal2(Long nbMeal2) {
        this.nbMeal2 = nbMeal2;
    }

    public Participation nbMeal2(Long nbMeal2) {
        this.setNbMeal2(nbMeal2);
        return this;
    }

    public Long getNbMeal3() {
        return this.nbMeal3;
    }

    public void setNbMeal3(Long nbMeal3) {
        this.nbMeal3 = nbMeal3;
    }

    public Participation nbMeal3(Long nbMeal3) {
        this.setNbMeal3(nbMeal3);
        return this;
    }

    public Boolean getAcceptedChart() {
        return this.acceptedChart;
    }

    public void setAcceptedChart(Boolean acceptedChart) {
        this.acceptedChart = acceptedChart;
    }

    public Participation acceptedChart(Boolean acceptedChart) {
        this.setAcceptedChart(acceptedChart);
        return this;
    }

    public Boolean getAcceptedContract() {
        return this.acceptedContract;
    }

    public void setAcceptedContract(Boolean acceptedContract) {
        this.acceptedContract = acceptedContract;
    }

    public Participation acceptedContract(Boolean acceptedContract) {
        this.setAcceptedContract(acceptedContract);
        return this;
    }

    public Boolean getNeedArrangement() {
        return this.needArrangement;
    }

    public void setNeedArrangement(Boolean needArrangement) {
        this.needArrangement = needArrangement;
    }

    public Participation needArrangement(Boolean needArrangement) {
        this.setNeedArrangement(needArrangement);
        return this;
    }

    public Status getStatus() {
        return this.status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Participation status(Status status) {
        this.setStatus(status);
        return this;
    }

    public String getExtraInformation() {
        return this.extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Participation extraInformation(String extraInformation) {
        this.setExtraInformation(extraInformation);
        return this;
    }

    public Exhibitor getExhibitor() {
        return this.exhibitor;
    }

    public void setExhibitor(Exhibitor exhibitor) {
        this.exhibitor = exhibitor;
    }

    public Participation exhibitor(Exhibitor exhibitor) {
        this.setExhibitor(exhibitor);
        return this;
    }

    public Salon getSalon() {
        return this.salon;
    }

    public void setSalon(Salon salon) {
        this.salon = salon;
    }

    public Participation salon(Salon salon) {
        this.setSalon(salon);
        return this;
    }

    public Boolean getGuestOfHonor() {
        return guestOfHonor;
    }

    public void setGuestOfHonor(Boolean guestOfHonor) {
        this.guestOfHonor = guestOfHonor;
    }

    public Boolean getCrushOfHeart() {
        return crushOfHeart;
    }

    public void setCrushOfHeart(Boolean crushOfHeart) {
        this.crushOfHeart = crushOfHeart;
    }

    public String getClientNumber() {
        return clientNumber;
    }

    public void setClientNumber(String clientNumber) {
        this.clientNumber = clientNumber;
    }

    public Boolean getHasOffer() {
        return hasOffer;
    }

    public void setHasOffer(Boolean hasOffer) {
        this.hasOffer = hasOffer;
    }

    public static boolean diffMeal(int indexMeal, Participation part1, Participation part2) {
        if (part1 == null && part2 != null) {
            return true;
        }
        if (part1 != null && part2 == null) {
            return true;
        }
        if (part1 != null && part2 != null) {
            if (indexMeal == 1) {
                return !Objects.equals(part1.getNbMeal1(), part2.getNbMeal1());
            } else if (indexMeal == 2) {
                return !Objects.equals(part1.getNbMeal2(), part2.getNbMeal2());
            } else {
                return !Objects.equals(part1.getNbMeal3(), part2.getNbMeal3());
            }
        }
        return false;
    }

    public static boolean diffArrangement(Participation part1, Participation part2) {
        if (part1 == null && part2 != null) {
            return true;
        }
        if (part1 != null && part2 == null) {
            return true;
        }
        if (part1 != null && part2 != null) {
            return !Objects.equals(part1.getNeedArrangement(), part2.getNeedArrangement());
        }
        return false;
    }


    public static boolean diffStatus(Participation part1, Participation part2) {
        if (part1 == null && part2 != null) {
            return true;
        }
        if (part1 != null && part2 == null) {
            return true;
        }
        if (part1 != null && part2 != null) {
            return !Objects.equals(part1.getStatus(), part2.getStatus());
        }
        return false;
    }

    public static String incrementClientNumber(String clientNumberMax, String referenceSalon) {
        int number = 100;
        if (clientNumberMax != null) {
            String[] split = clientNumberMax.split("-");
            number = Integer.parseInt(split[split.length - 1]);
        }

        // Incrémenter le nombre
        number = number + 1;

        // Reformater le numéro incrémenté avec le même nombre de chiffres
        return referenceSalon + "-" + String.format("%03d", number);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Participation)) {
            return false;
        }
        return getId() != null && getId().equals(((Participation) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    @Override
    public String toString() {
        return ("Participation{" + "id=" + getId() + ", registrationDate='" + getRegistrationDate() + "'" +
                ", clientNumber='" + getClientNumber() + "'" + ", nbMeal1=" + getNbMeal1() + ", nbMeal2=" +
                getNbMeal2() + ", nbMeal3=" + getNbMeal3() + ", acceptedChart='" + getAcceptedChart() + "'" +
                ", acceptedContract='" + getAcceptedContract() + "'" + ", needArrangement='" + getNeedArrangement() +
                "'" + ", status='" + getStatus() + "'" + ", extraInformation='" + getExtraInformation() + "'" + "}");
    }
}
