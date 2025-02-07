package ch.salon.web.rest.dto;

import java.io.Serializable;

public class StandInfoStats implements Serializable {
    private Long nbTable = 0L;
    private Long nbChair = 0L;
    private Long nbElectricity = 0L;
    private Long nbOffer = 0L;

    public Long getNbTable() {
        return nbTable;
    }

    public void setNbTable(Long nbTable) {
        this.nbTable = nbTable;
    }

    public Long getNbChair() {
        return nbChair;
    }

    public void setNbChair(Long nbChair) {
        this.nbChair = nbChair;
    }

    public Long getNbElectricity() {
        return nbElectricity;
    }

    public void setNbElectricity(Long nbElectricity) {
        this.nbElectricity = nbElectricity;
    }

    public Long getNbOffer() {
        return nbOffer;
    }

    public void setNbOffer(Long nbOffer) {
        this.nbOffer = nbOffer;
    }
}
