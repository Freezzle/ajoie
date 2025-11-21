package ch.salon.web.rest.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class InfoInvoice implements Serializable {
    long nbDraft = 0L;
    long nbIssued = 0L;
    long nbPaid = 0L;
    long nbExpired = 0L;
}
