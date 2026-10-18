package ch.salon.service.waitlist;

import ch.salon.domain.WaitlistEntry;
import ch.salon.repository.WaitlistEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Inscription à la liste d'attente de la plateforme (page d'accueil publique « e-salon »).
 */
@Service
@RequiredArgsConstructor
public class PublicWaitlistService {

    public static final String ENTITY_NAME = "waitlistEntry";

    private final WaitlistEntryRepository waitlistEntryRepository;

    /**
     * Enregistre une adresse email dans la liste d'attente.
     * L'email est unique : si l'adresse est déjà inscrite, l'appel ne fait rien et se termine
     * normalement (succès silencieux), afin de ne jamais révéler si une adresse est déjà connue.
     */
    @Transactional
    public void subscribe(String rawEmail) {
        String email = normalize(rawEmail);

        if (waitlistEntryRepository.existsByEmail(email)) {
            return;
        }

        try {
            WaitlistEntry entry = new WaitlistEntry();
            entry.setEmail(email);
            waitlistEntryRepository.saveAndFlush(entry);
        } catch (DataIntegrityViolationException alreadySubscribed) {
            // Course avec une autre requête concurrente sur le même email : déjà inscrit, succès silencieux.
        }
    }

    private String normalize(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }
}

