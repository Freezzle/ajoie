package ch.salon.service.dto;

import lombok.Data;

import java.io.Serializable;
import java.util.UUID;

@Data
public class BankAccountDTO implements Serializable {

    private UUID id;
    private String iban;
    private String accountHolder;
    private String bic;
}
