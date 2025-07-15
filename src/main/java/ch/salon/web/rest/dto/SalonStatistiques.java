package ch.salon.web.rest.dto;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

public class SalonStatistiques implements Serializable {

    private Map<String, Long> dimensionStands = new HashMap<>();
    private int nbConference = 0;
    private int nbWorkshop = 0;
    private int nbStands = 0;
    private int nbMeal1 = 0;
    private int nbMeal2 = 0;
    private int nbMeal3 = 0;
    private int nbGuestOfHonor = 0;
    private int nbCrushOfHeart = 0;
    private StandInfoStats standInfo = new StandInfoStats();
    private Map<String, Long> categoriesStands = new HashMap<>();
    private FacturationStats facturation = new FacturationStats();

    public Map<String, Long> getDimensionStands() {
        return dimensionStands;
    }

    public void setDimensionStands(Map<String, Long> dimensionStands) {
        this.dimensionStands = dimensionStands;
    }

    public int getNbConference() {
        return nbConference;
    }

    public void setNbConference(int nbConference) {
        this.nbConference = nbConference;
    }

    public int getNbStands() {
        return nbStands;
    }

    public void setNbStands(int nbStands) {
        this.nbStands = nbStands;
    }

    public int getNbGuestOfHonor() {
        return nbGuestOfHonor;
    }

    public void setNbGuestOfHonor(int nbGuestOfHonor) {
        this.nbGuestOfHonor = nbGuestOfHonor;
    }

    public int getNbCrushOfHeart() {
        return nbCrushOfHeart;
    }

    public void setNbCrushOfHeart(int nbCrushOfHeart) {
        this.nbCrushOfHeart = nbCrushOfHeart;
    }

    public int getNbMeal1() {
        return nbMeal1;
    }

    public void setNbMeal1(int nbMeal1) {
        this.nbMeal1 = nbMeal1;
    }

    public int getNbMeal2() {
        return nbMeal2;
    }

    public void setNbMeal2(int nbMeal2) {
        this.nbMeal2 = nbMeal2;
    }

    public int getNbMeal3() {
        return nbMeal3;
    }

    public void setNbMeal3(int nbMeal3) {
        this.nbMeal3 = nbMeal3;
    }

    public StandInfoStats getStandInfo() {
        return standInfo;
    }

    public void setStandInfo(StandInfoStats standInfo) {
        this.standInfo = standInfo;
    }

    public Map<String, Long> getCategoriesStands() {
        return categoriesStands;
    }

    public void setCategoriesStands(Map<String, Long> categoriesStands) {
        this.categoriesStands = categoriesStands;
    }

    public FacturationStats getFacturation() {
        return facturation;
    }

    public void setFacturation(FacturationStats facturation) {
        this.facturation = facturation;
    }

    public int getNbWorkshop() {
        return nbWorkshop;
    }

    public void setNbWorkshop(int nbWorkshop) {
        this.nbWorkshop = nbWorkshop;
    }
}
