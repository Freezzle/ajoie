package ch.salon.web.rest.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
public class SplitInvoicing implements Serializable {

    private List<UUID> invoicesIds = new ArrayList<>();
}
