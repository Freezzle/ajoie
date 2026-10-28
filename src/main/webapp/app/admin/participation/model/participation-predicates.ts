import {IParticipationList} from './participation.interface';

/** Une participation « à facturer en brouillon » possède au moins une facture en brouillon. */
export function hasDraftPredicate(p: Pick<IParticipationList, 'nbDraft'>): boolean {
    return p.nbDraft > 0;
}

/** Une participation « à surveiller » cumule un signalement exposant ou au moins une facture échue. */
export function toWatchPredicate(p: Pick<IParticipationList, 'nbExpired' | 'exhibitor'>): boolean {
    return !!p.exhibitor?.redFlag || !!p.exhibitor?.duplicateDetected || p.nbExpired > 0;
}
