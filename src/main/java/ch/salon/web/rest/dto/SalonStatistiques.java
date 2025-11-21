package ch.salon.web.rest.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

@Data
public class SalonStatistiques implements Serializable {

    private Map<String, Long> dimensionStands = new HashMap<>();
    private int nbConference = 0;
    private int nbWorkshop = 0;
    private int nbStands = 0;
    private int nbCoExhibitors = 0;
    private int nbMeal1 = 0;
    private int nbMeal2 = 0;
    private int nbMeal3 = 0;
    private int nbGuestOfHonor = 0;
    private int nbCrushOfHeart = 0;
    private StandInfoStats standInfo = new StandInfoStats();
    private Map<String, Long> categoriesStands = new HashMap<>();
    private FacturationStats facturation = new FacturationStats();
}
