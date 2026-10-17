package ch.salon.service.dto.registration;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Charge utile du formulaire public d'inscription (création et modification).
 * Les prestations non souhaitées sont simplement absentes des listes.
 */
@Data
public class RegistrationRequestDTO implements Serializable {

    @NotNull
    @Valid
    private RegistrationExhibitorDTO exhibitor;

    @NotNull
    @Valid
    private RegistrationParticipationDTO participation;

    @Valid
    private List<RegistrationStandDTO> stands = new ArrayList<>();

    @Valid
    private List<RegistrationTalkDTO> conferences = new ArrayList<>();

    @Valid
    private List<RegistrationTalkDTO> workshops = new ArrayList<>();

    /**
     * Jeton Cloudflare Turnstile. Non requis en mode modification (le lien signé fait foi).
     */
    private String captchaToken;
}
