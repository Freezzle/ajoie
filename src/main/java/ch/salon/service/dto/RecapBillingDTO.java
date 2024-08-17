package ch.salon.service.dto;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class RecapBillingDTO implements Serializable {

    private List<BillingLineDTO> lines = new ArrayList<>();

    public List<BillingLineDTO> getLines() {
        return lines;
    }

    public void setLines(List<BillingLineDTO> lines) {
        this.lines = lines;
    }
}
