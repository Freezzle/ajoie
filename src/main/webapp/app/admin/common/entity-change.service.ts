import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';

import {PresenceService} from '../presence/service/presence.service';

/** Entités susceptibles d'être modifiées hors du cycle requête/réponse. */
export type EntityChangedType = 'EXHIBITOR' | 'PARTICIPATION' | 'INVOICE_PLAN' | 'SALON';

export interface EntityChangedMessage {
    entityType: EntityChangedType;
    entityId: string;
}

/**
 * Écoute les entités modifiées par un traitement serveur asynchrone (envoi d'email
 * notamment) : la requête HTTP d'origine a déjà rendu la main, et l'écran afficherait
 * sinon un état intermédiaire — « en cours d'envoi » — jusqu'au prochain rafraîchissement
 * manuel.
 *
 * Le canal est découpé par salon, le seul identifiant que le front connaît déjà.
 */
@Injectable({providedIn: 'root'})
export class EntityChangeService {
    private readonly presenceService = inject(PresenceService);

    /** Entités modifiées dans un salon ; se réabonne après chaque reconnexion du socket. */
    watchSalon(idSalon: string): Observable<EntityChangedMessage> {
        return new Observable<EntityChangedMessage>(subscriber => {
            let subscription: { unsubscribe: () => void } | undefined;

            const connection = this.presenceService.connected$.subscribe(connected => {
                subscription?.unsubscribe();
                subscription = undefined;

                if (!connected) {
                    return;
                }

                subscription = this.presenceService.getClient()
                                   ?.subscribe(`/topic/salon/${idSalon}/entity-changed`,
                                               message => subscriber.next(
                                                   JSON.parse(message.body) as EntityChangedMessage));
            });

            return () => {
                subscription?.unsubscribe();
                connection.unsubscribe();
            };
        });
    }
}
