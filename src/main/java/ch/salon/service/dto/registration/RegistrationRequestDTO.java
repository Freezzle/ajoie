package ch.salon.service.dto.registration;

import ch.salon.domain.enumeration.Status;
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

    /**
     * Statut actuel de la participation. Renseigné uniquement en lecture (GET) ; ignoré en entrée,
     * le statut n'étant jamais modifiable depuis le formulaire public.
     */
    private Status status;

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
