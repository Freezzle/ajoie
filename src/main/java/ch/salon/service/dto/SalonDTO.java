package ch.salon.service.dto;

import java.io.Serializable;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

public class SalonDTO implements Serializable {

    private UUID id;

    private String referenceNumber;

    private String place;

    private Instant startingDate;

    private Instant endingDate;

    private Double priceMeal1;

    private Double priceMeal2;

    private Double priceMeal3;

    private Double priceConference;

    private Double priceWorkshop;

    private Double priceSharingStand;

    private String extraInformation;

    private Set<PriceStandDTO> priceStandSalons = new HashSet<>();

    public SalonDTO() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public String getPlace() {
        return place;
    }

    public void setPlace(String place) {
        this.place = place;
    }

    public Instant getStartingDate() {
        return startingDate;
    }

    public void setStartingDate(Instant startingDate) {
        this.startingDate = startingDate;
    }

    public Instant getEndingDate() {
        return endingDate;
    }

    public void setEndingDate(Instant endingDate) {
        this.endingDate = endingDate;
    }

    public Double getPriceMeal1() {
        return priceMeal1;
    }

    public void setPriceMeal1(Double priceMeal1) {
        this.priceMeal1 = priceMeal1;
    }

    public Double getPriceMeal2() {
        return priceMeal2;
    }

    public void setPriceMeal2(Double priceMeal2) {
        this.priceMeal2 = priceMeal2;
    }

    public Double getPriceMeal3() {
        return priceMeal3;
    }

    public void setPriceMeal3(Double priceMeal3) {
        this.priceMeal3 = priceMeal3;
    }

    public Double getPriceConference() {
        return priceConference;
    }

    public void setPriceConference(Double priceConference) {
        this.priceConference = priceConference;
    }

    public Double getPriceWorkshop() {
        return priceWorkshop;
    }

    public void setPriceWorkshop(Double priceWorkshop) {
        this.priceWorkshop = priceWorkshop;
    }

    public Double getPriceSharingStand() {
        return priceSharingStand;
    }

    public void setPriceSharingStand(Double priceSharingStand) {
        this.priceSharingStand = priceSharingStand;
    }

    public String getExtraInformation() {
        return extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public Set<PriceStandDTO> getPriceStandSalons() {
        return priceStandSalons;
    }

    public void setPriceStandSalons(Set<PriceStandDTO> priceStandSalons) {
        this.priceStandSalons = priceStandSalons;
    }
}
