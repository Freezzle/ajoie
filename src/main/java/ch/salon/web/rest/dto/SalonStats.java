package ch.salon.web.rest.dto;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class SalonStats implements Serializable {

    private long nbStandValidated = 0;
    private long nbStandInTreatment = 0;
    private long nbStandRefused = 0;

    private long nbMealSaturdayMidday = 0;
    private long nbMealSaturdayEvening = 0;
    private long nbMealSundayMidday = 0;

    private long nbStandValidatedPaid = 0;
    private long nbStandValidatedUnpaid = 0;

    private List<DimensionStats> dimensionStats = new ArrayList<>();

    public long getNbStandValidated() {
        return nbStandValidated;
    }

    public void setNbStandValidated(long nbStandValidated) {
        this.nbStandValidated = nbStandValidated;
    }

    public long getNbStandInTreatment() {
        return nbStandInTreatment;
    }

    public void setNbStandIntreatment(long nbStandInTreatment) {
        this.nbStandInTreatment = nbStandInTreatment;
    }

    public long getNbStandRefused() {
        return nbStandRefused;
    }

    public void setNbStandRefused(long nbStandRefused) {
        this.nbStandRefused = nbStandRefused;
    }

    public long getNbMealSaturdayMidday() {
        return nbMealSaturdayMidday;
    }

    public void setNbMealSaturdayMidday(long nbMealSaturdayMidday) {
        this.nbMealSaturdayMidday = nbMealSaturdayMidday;
    }

    public long getNbMealSaturdayEvening() {
        return nbMealSaturdayEvening;
    }

    public void setNbMealSaturdayEvening(long nbMealSaturdayEvening) {
        this.nbMealSaturdayEvening = nbMealSaturdayEvening;
    }

    public long getNbMealSundayMidday() {
        return nbMealSundayMidday;
    }

    public void setNbMealSundayMidday(long nbMealSundayMidday) {
        this.nbMealSundayMidday = nbMealSundayMidday;
    }

    public List<DimensionStats> getDimensionStats() {
        return dimensionStats;
    }

    public void setDimensionStats(List<DimensionStats> dimensionStats) {
        this.dimensionStats = dimensionStats;
    }

    public void setNbStandInTreatment(long nbStandInTreatment) {
        this.nbStandInTreatment = nbStandInTreatment;
    }

    public long getNbStandValidatedPaid() {
        return nbStandValidatedPaid;
    }

    public void setNbStandValidatedPaid(long nbStandValidatedPaid) {
        this.nbStandValidatedPaid = nbStandValidatedPaid;
    }

    public long getNbStandValidatedUnpaid() {
        return nbStandValidatedUnpaid;
    }

    public void setNbStandValidatedUnpaid(long nbStandValidatedUnpaid) {
        this.nbStandValidatedUnpaid = nbStandValidatedUnpaid;
    }
}
