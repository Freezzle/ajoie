package ch.salon.domain;

import ch.salon.domain.enumeration.InvoiceSendingMethod;
import ch.salon.domain.enumeration.ModePaymentMeals;
import ch.salon.domain.enumeration.Status;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "participation")
@Data
public class Participation implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "client_number")
    private String clientNumber;

    @Column(name = "therapist_name", nullable = false)
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

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_payment_meals")
    private ModePaymentMeals modePaymentMeals = ModePaymentMeals.SEPARATE;

    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_sending_method")
    private InvoiceSendingMethod invoiceSendingMethod = InvoiceSendingMethod.EMAIL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties(value = {"priceStandSalons"}, allowSetters = true)
    private Salon salon;

    @Column(name = "rating_friendliness")
    private Double ratingFriendliness;

    @Column(name = "rating_payment_speed")
    private Double ratingPaymentSpeed;

    @Column(name = "rating_service_quality")
    private Double ratingServiceQuality;

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
}
