import {Injectable} from '@angular/core';

export interface VolunteerRegistrationDraft {
    step: number;
    maxReached: number;
    value: unknown;
}

/**
 * Brouillon du parcours bénévole en sessionStorage (une entrée par salon).
 */
@Injectable({providedIn: 'root'})
export class VolunteerRegistrationDraftStorageService {
    private static readonly PREFIX = 'ajoie-volunteer-draft-';

    private key(salonId: string): string {
        return `${VolunteerRegistrationDraftStorageService.PREFIX}${salonId}`;
    }

    save(salonId: string, draft: VolunteerRegistrationDraft): void {
        try {
            sessionStorage.setItem(this.key(salonId), JSON.stringify(draft));
        } catch {
            // Quota ou stockage indisponible : on ignore silencieusement.
        }
    }

    load(salonId: string): VolunteerRegistrationDraft | null {
        try {
            const raw = sessionStorage.getItem(this.key(salonId));
            return raw ? JSON.parse(raw) as VolunteerRegistrationDraft : null;
        } catch {
            return null;
        }
    }

    clear(salonId: string): void {
        try {
            sessionStorage.removeItem(this.key(salonId));
        } catch {
            // Ignoré.
        }
    }
}
