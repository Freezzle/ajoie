import {HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {IParticipation} from '../../participation/model/participation.interface';
import {ParticipationService} from '../../participation/service/participation.service';

/**
 * Charge les participations d'un salon et pré-sélectionne celle de la route quand fournie.
 */
export const loadParticipationOptions = (
    eventId: string,
    participationId: string | null,
    participationService: ParticipationService,
    setSelected: (participation: IParticipation | null) => void
): Observable<IParticipation[]> =>
    participationService.query(eventId).pipe(
        map((res: HttpResponse<IParticipation[]>) => res.body ?? []),
        map(participations => {
            if (participationId) {
                setSelected(participations.find(p => p.id === participationId) ?? null);
            }
            return participations;
        })
    );
