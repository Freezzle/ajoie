import {Injectable} from '@angular/core';
import {RegistrationFormValue} from './registration-form.service';

export interface RegistrationDraft {
    step: number;
    maxReached: number;
    value: RegistrationFormValue;
}

/**
 * Sauvegarde du brouillon d'inscription dans le sessionStorage du navigateur, pour éviter de tout perdre
 * en cas de fermeture accidentelle de l'onglet ou de rechargement de la page.
 * Un brouillon par salon (clé dérivée du salonId), jamais partagé entre onglets différents (sessionStorage).
 */
@Injectable({providedIn: 'root'})
export class RegistrationDraftStorageService {
    private readonly prefix = 'ajoie-registration-draft-';

    save(salonId: string, draft: RegistrationDraft): void {
        try {
            sessionStorage.setItem(this.key(salonId), JSON.stringify(draft));
        } catch {
            // sessionStorage indisponible (navigation privée, quota dépassé, etc.) : on ignore silencieusement.
        }
    }

    load(salonId: string): RegistrationDraft | null {
        try {
            const raw = sessionStorage.getItem(this.key(salonId));
            return raw ? JSON.parse(raw) as RegistrationDraft : null;
        } catch {
            return null;
        }
    }

    clear(salonId: string): void {
        try {
            sessionStorage.removeItem(this.key(salonId));
        } catch {
            // ignore
        }
    }

    private key(salonId: string): string {
        return `${this.prefix}${salonId}`;
    }
}
