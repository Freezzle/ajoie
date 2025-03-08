package ch.salon.web.rest.dto;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class SplitInvoicing implements Serializable {

    private List<UUID> invoicesIds = new ArrayList<>();

    public List<UUID> getInvoicesIds() {
        return invoicesIds;
    }

    public void setInvoicesIds(List<UUID> invoicesIds) {
        this.invoicesIds = invoicesIds;
    }
}
