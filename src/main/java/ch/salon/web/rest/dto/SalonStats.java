package ch.salon.web.rest.dto;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class SalonStats implements Serializable {

    private long nbStandValidated = 0;
    private long nbStandInTreatment = 0;
    private long nbStandRefused = 0;
    private long nbStandCanceled = 0;

    private long nbMealSaturdayMidday = 0;
    private long nbMealSaturdayEvening = 0;
    private long nbMealSundayMidday = 0;

    private long nbParticipationAcceptedPaid = 0;
    private long nbParticipationAcceptedUnpaid = 0;

    private List<DimensionStats> dimensionStats = new ArrayList<>();

    public long getNbStandValidated() {
        return nbStandValidated;
    }

    public void setNbStandAccepted(long nbStandValidated) {
        this.nbStandValidated = nbStandValidated;
    }

    public long getNbStandInTreatment() {
        return nbStandInTreatment;
    }

    public void setNbStandInVerification(long nbStandInTreatment) {
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

    public long getNbParticipationAcceptedPaid() {
        return nbParticipationAcceptedPaid;
    }

    public void setNbParticipationAcceptedPaid(long nbParticipationAcceptedPaid) {
        this.nbParticipationAcceptedPaid = nbParticipationAcceptedPaid;
    }

    public long getNbParticipationAcceptedUnpaid() {
        return nbParticipationAcceptedUnpaid;
    }

    public void setNbParticipationAcceptedUnpaid(long nbParticipationAcceptedUnpaid) {
        this.nbParticipationAcceptedUnpaid = nbParticipationAcceptedUnpaid;
    }

    public long getNbStandCanceled() {
        return nbStandCanceled;
    }

    public void setNbStandCanceled(long nbStandCanceled) {
        this.nbStandCanceled = nbStandCanceled;
    }
}
