package ch.salon.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.TenantId;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "bank_account")
@Data
public class BankAccount implements Serializable, TenantOwned {
    @Id
    @GeneratedValue
    @Column(name = "id")
    private UUID id;

    @TenantId
    @NotNull
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @NotNull
    @Column(name = "iban", nullable = false)
    private String iban;

    @NotNull
    @Column(name = "account_holder", nullable = false)
    private String accountHolder;

    @Column(name = "bic")
    private String bic;

    public static String formatIban(String iban) {
        if (iban == null) return "";
        String cleanIban = iban.replaceAll("\\s+", "");
        if (cleanIban.length() <= 4) return cleanIban;

        StringBuilder formatted = new StringBuilder();
        formatted.append(cleanIban.substring(0, 4));
        for (int i = 4; i < cleanIban.length(); i += 4) {
            formatted.append(" ");
            formatted.append(cleanIban.substring(i, Math.min(i + 4, cleanIban.length())));
        }
        return formatted.toString();
    }
}
