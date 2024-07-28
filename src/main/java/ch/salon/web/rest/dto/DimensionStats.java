package ch.salon.web.rest.dto;

public class DimensionStats {

    private String dimension = "";
    private long nb = 0;

    public DimensionStats(String dimension, long nb) {
        this.dimension = dimension;
        this.nb = nb;
    }

    public String getDimension() {
        return dimension;
    }

    public void setDimension(String dimension) {
        this.dimension = dimension;
    }

    public long getNb() {
        return nb;
    }

    public void setNb(long nb) {
        this.nb = nb;
    }
}
