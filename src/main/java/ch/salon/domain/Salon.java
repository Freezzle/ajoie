package ch.salon.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.TenantId;

import java.io.Serializable;
import java.time.Instant;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Entity
@Table(name = "salon")
@Data
public class Salon implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(length = 10)
    private String referenceNumber;

    @NotNull
    @Column(name = "place", nullable = false)
    private String place;

    @NotNull
    @Column(name = "starting_date", nullable = false)
    private Instant startingDate;

    @NotNull
    @Column(name = "ending_date", nullable = false)
    private Instant endingDate;

    @Column(name = "price_meal_1")
    private Double priceMeal1;

    @Column(name = "price_meal_2")
    private Double priceMeal2;

    @Column(name = "price_meal_3")
    private Double priceMeal3;

    @Column(name = "price_conference")
    private Double priceConference;

    @Column(name = "price_workshop")
    private Double priceWorkshop;

    @Column(name = "price_sharing_stand")
    private Double priceSharingStand;

    @Column(name = "extra_information")
    private String extraInformation;

    @ManyToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "headquarters_address_id")
    private Address headquartersAddress;

    @ManyToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "event_address_id")
    private Address eventAddress;

    @ManyToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "bank_account_id")
    private BankAccount bankAccount;

    @OneToMany(fetch = FetchType.EAGER, orphanRemoval = true, cascade = CascadeType.ALL, targetEntity = PriceStandSalon.class)
    @JoinColumn(name = "salon_id", referencedColumnName = "id")
    private Set<PriceStandSalon> priceStandSalons = new HashSet<>();

    public static boolean hasDifference(Salon salon1, Salon salon2) {
        return ((salon1 == null && salon2 != null) || (salon1 != null && salon2 == null) ||
                (salon1 != null && salon2 != null &&
                        (!Objects.equals(salon1.getPriceConference(), salon2.getPriceConference()) ||
                                !Objects.equals(salon1.getPriceWorkshop(), salon2.getPriceWorkshop()) ||
                                !Objects.equals(salon1.getPriceSharingStand(), salon2.getPriceSharingStand()) ||
                                !Objects.equals(salon1.getPriceMeal1(), salon2.getPriceMeal1()) ||
                                !Objects.equals(salon1.getPriceMeal2(), salon2.getPriceMeal2()) ||
                                !Objects.equals(salon1.getPriceMeal3(), salon2.getPriceMeal3()) ||
                                hasPriceStandChanged(salon1.getPriceStandSalons(), salon2.getPriceStandSalons()))));
    }

    public static boolean hasPriceStandChanged(Set<PriceStandSalon> oldPrices, Set<PriceStandSalon> newPrices) {
        Map<UUID, PriceStandSalon> oldPriceMap =
                oldPrices.stream().collect(Collectors.toMap(PriceStandSalon::getId, Function.identity()));

        Map<UUID, PriceStandSalon> newPriceMap =
                newPrices.stream().collect(Collectors.toMap(PriceStandSalon::getId, Function.identity()));

        // Vérification des éléments manquants et des changements de prix
        for (UUID id : oldPriceMap.keySet()) {
            PriceStandSalon oldPrice = oldPriceMap.get(id);
            PriceStandSalon newPrice = newPriceMap.get(id);

            if (newPrice == null) {
                return true;
            } else if (oldPrice.getPrice().doubleValue() != newPrice.getPrice().doubleValue()) {
                return true;
            }
        }

        return false;
    }
}
