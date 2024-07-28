package ch.salon.service.dto;

import ch.salon.domain.Salon;
import ch.salon.domain.enumeration.Status;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

public class ParticipationDTO implements Serializable {

    private UUID id;

    private String clientNumber;

    private Instant registrationDate;

    private Long nbMeal1;

    private Long nbMeal2;

    private Long nbMeal3;

    private Boolean acceptedChart;

    private Boolean acceptedContract;

    private Boolean needArrangment;

    private Boolean isBillingClosed;

    private Status status;

    private String extraInformation;

    private ExhibitorLightDTO exhibitor;

    private Salon salon;

    public ParticipationDTO() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getClientNumber() {
        return clientNumber;
    }

    public void setClientNumber(String clientNumber) {
        this.clientNumber = clientNumber;
    }

    public Instant getRegistrationDate() {
        return registrationDate;
    }

    public void setRegistrationDate(Instant registrationDate) {
        this.registrationDate = registrationDate;
    }

    public Long getNbMeal1() {
        return nbMeal1;
    }

    public void setNbMeal1(Long nbMeal1) {
        this.nbMeal1 = nbMeal1;
    }

    public Long getNbMeal2() {
        return nbMeal2;
    }

    public void setNbMeal2(Long nbMeal2) {
        this.nbMeal2 = nbMeal2;
    }

    public Long getNbMeal3() {
        return nbMeal3;
    }

    public void setNbMeal3(Long nbMeal3) {
        this.nbMeal3 = nbMeal3;
    }

    public Boolean getAcceptedChart() {
        return acceptedChart;
    }

    public void setAcceptedChart(Boolean acceptedChart) {
        this.acceptedChart = acceptedChart;
    }

    public Boolean getAcceptedContract() {
        return acceptedContract;
    }

    public void setAcceptedContract(Boolean acceptedContract) {
        this.acceptedContract = acceptedContract;
    }

    public Boolean getNeedArrangment() {
        return needArrangment;
    }

    public void setNeedArrangment(Boolean needArrangment) {
        this.needArrangment = needArrangment;
    }

    public Boolean getBillingClosed() {
        return isBillingClosed;
    }

    public void setBillingClosed(Boolean billingClosed) {
        isBillingClosed = billingClosed;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public String getExtraInformation() {
        return extraInformation;
    }

    public void setExtraInformation(String extraInformation) {
        this.extraInformation = extraInformation;
    }

    public ExhibitorLightDTO getExhibitor() {
        return exhibitor;
    }

    public void setExhibitor(ExhibitorLightDTO exhibitor) {
        this.exhibitor = exhibitor;
    }

    public Salon getSalon() {
        return salon;
    }

    public void setSalon(Salon salon) {
        this.salon = salon;
    }
}
