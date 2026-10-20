import {
    hhmm,
    isPlaced,
    minutesOfDay,
    Talk,
    talkKey,
    TimelineData,
    TimelineDay,
    TimelineRoomData
} from './talks-planning-model';

/**
 * Règles métier du planning des conférences.
 * Fonctions pures : toutes les heures sont en minutes depuis minuit.
 */

export interface RoomBounds {
    start: number;
    end: number;
}

/** Raison de conflit : clé i18n + paramètres, traduite par la couche UI. */
export interface ConflictReason {
    key: string;
    params: Record<string, string | number>;
}

export interface PlacementCheck {
    ok: boolean;
    reasons: ConflictReason[];
}

export interface SlotCandidates {
    here: Talk[];
    free: Talk[];
    move: Talk[];
    off: { talk: Talk; reason: ConflictReason }[];
}

// ---------------------------------------------------------------------------
// Accès à la configuration
// ---------------------------------------------------------------------------

export function findDay(config: TimelineData, dayId: string | null): TimelineDay | undefined {
    return dayId ? config.days.find(day => day.id === dayId) : undefined;
}

export function findRoomLabel(config: TimelineData, roomId: string | null): string {
    return config.rooms.find(room => room.id === roomId)?.label ?? '';
}

function findRoomData(config: TimelineData, dayId: string | null, roomId: string | null): TimelineRoomData | undefined {
    if (!dayId || !roomId) {
        return undefined;
    }
    return findDay(config, dayId)?.rooms.find(room => room.roomId === roomId);
}

/** Plage d'ouverture d'une salle ce jour-là, ou `null` si la salle est fermée. */
export function roomBounds(config: TimelineData, dayId: string | null, roomId: string | null): RoomBounds | null {
    const roomData = findRoomData(config, dayId, roomId);
    if (!roomData) {
        return null;
    }
    return {start: minutesOfDay(roomData.startingHour), end: minutesOfDay(roomData.endingHour)};
}

/** Plage affichée pour un jour : de la première ouverture à la dernière fermeture. */
export function dayBounds(day: TimelineDay | undefined): RoomBounds | null {
    if (!day || day.rooms.length === 0) {
        return null;
    }
    return {
        start: Math.min(...day.rooms.map(room => minutesOfDay(room.startingHour))),
        end: Math.max(...day.rooms.map(room => minutesOfDay(room.endingHour)))
    };
}

// ---------------------------------------------------------------------------
// Plage occupée
// ---------------------------------------------------------------------------

/** Début de la préparation. */
export function occupiedStart(talk: Talk, start: number): number {
    return start - talk.preparationMinutes;
}

/** Fin du rangement. */
export function occupiedEnd(talk: Talk, start: number): number {
    return start + talk.durationTalkMinutes + talk.cleanupMinutes;
}

// ---------------------------------------------------------------------------
// Heures de début possibles
// ---------------------------------------------------------------------------

/** Premier début possible : la préparation doit tenir après l'ouverture. */
export function firstStart(talk: Talk, bounds: RoomBounds, step: number): number {
    return bounds.start + Math.ceil(talk.preparationMinutes / step) * step;
}

/** Arrondi au plus proche sur la grille des débuts (glisser-déposer). */
export function snapStart(rawMinute: number, bounds: RoomBounds | null, step: number): number {
    const base = bounds ? bounds.start : 0;
    return base + Math.round((rawMinute - base) / step) * step;
}

/** Arrondi inférieur sur la grille des débuts (clic et survol). */
export function floorStart(rawMinute: number, bounds: RoomBounds | null, step: number): number {
    const base = bounds ? bounds.start : 0;
    return base + Math.floor((rawMinute - base) / step) * step;
}

/** Tous les débuts possibles dans la salle, conflits compris. */
export function startCandidates(talk: Talk, config: TimelineData, dayId: string | null, roomId: string | null): number[] {
    const bounds = roomBounds(config, dayId, roomId);
    if (!bounds) {
        return [];
    }
    const step = config.placementIntervalMinutes;
    const out: number[] = [];
    for (let m = firstStart(talk, bounds, step); occupiedEnd(talk, m) <= bounds.end; m += step) {
        out.push(m);
    }
    return out;
}

// ---------------------------------------------------------------------------
// Conflits
// ---------------------------------------------------------------------------

export function checkPlacement(talk: Talk,
                               talks: Talk[],
                               config: TimelineData,
                               dayId: string | null,
                               roomId: string | null,
                               start: number): PlacementCheck {
    const reasons: ConflictReason[] = [];
    const bounds = roomBounds(config, dayId, roomId);

    if (!bounds) {
        reasons.push({key: 'planningTalks.conflict.closedRoom', params: {}});
    } else if (occupiedStart(talk, start) < bounds.start || occupiedEnd(talk, start) > bounds.end) {
        reasons.push({
                         key: 'planningTalks.conflict.outOfHours',
                         params: {start: hhmm(bounds.start), end: hhmm(bounds.end)}
                     });
    }

    const key = talkKey(talk);
    for (const other of talks) {
        if (talkKey(other) === key || !isPlaced(other) || other.dayId !== dayId) {
            continue;
        }
        const otherStart = other.startMinute!;
        if (other.roomId === roomId) {
            // Même salle : chevauchement des plages occupées, battements compris.
            if (occupiedStart(talk, start) < occupiedEnd(other, otherStart)
                && occupiedStart(other, otherStart) < occupiedEnd(talk, start)) {
                reasons.push({
                                 key: 'planningTalks.conflict.overlap',
                                 params: {title: other.title, time: hhmm(otherStart)}
                             });
            }
        } else if (other.participation.therapistName === talk.participation.therapistName
            && start < otherStart + other.durationTalkMinutes
            && otherStart < start + talk.durationTalkMinutes) {
            // Autre salle : seules les heures d'intervention comptent, sans les battements.
            reasons.push({
                             key: 'planningTalks.conflict.therapist',
                             params: {
                                 name: talk.participation.therapistName,
                                 room: findRoomLabel(config, other.roomId),
                                 time: hhmm(otherStart)
                             }
                         });
        }
    }

    return {ok: reasons.length === 0, reasons};
}

/** Conflits d'une intervention sur sa position actuelle (vide si non placée). */
export function issuesOf(talk: Talk, talks: Talk[], config: TimelineData): ConflictReason[] {
    if (!isPlaced(talk)) {
        return [];
    }
    return checkPlacement(talk, talks, config, talk.dayId, talk.roomId, talk.startMinute!).reasons;
}

/** Débuts possibles sans conflit. */
export function freeStarts(talk: Talk,
                           talks: Talk[],
                           config: TimelineData,
                           dayId: string | null,
                           roomId: string | null): number[] {
    return startCandidates(talk, config, dayId, roomId)
        .filter(start => checkPlacement(talk, talks, config, dayId, roomId, start).ok);
}

// ---------------------------------------------------------------------------
// Créneau choisi
// ---------------------------------------------------------------------------

export function slotCandidates(talks: Talk[],
                               config: TimelineData,
                               dayId: string,
                               roomId: string,
                               start: number): SlotCandidates {
    const here = talks.filter(talk => isPlaced(talk)
        && talk.dayId === dayId
        && talk.roomId === roomId
        && occupiedStart(talk, talk.startMinute!) <= start
        && start < occupiedEnd(talk, talk.startMinute!));
    const hereKeys = new Set(here.map(talkKey));

    const free: Talk[] = [];
    const move: Talk[] = [];
    const off: { talk: Talk; reason: ConflictReason }[] = [];

    for (const talk of talks) {
        if (hereKeys.has(talkKey(talk))) {
            continue;
        }
        const check = checkPlacement(talk, talks, config, dayId, roomId, start);
        if (!check.ok) {
            off.push({talk, reason: check.reasons[0]});
        } else if (isPlaced(talk)) {
            move.push(talk);
        } else {
            free.push(talk);
        }
    }

    return {here, free, move, off};
}

// ---------------------------------------------------------------------------
// Indicateurs
// ---------------------------------------------------------------------------

export function unplacedTalks(talks: Talk[]): Talk[] {
    return talks.filter(talk => !isPlaced(talk));
}

export function conflictingTalks(talks: Talk[], config: TimelineData): Talk[] {
    return talks.filter(talk => isPlaced(talk) && issuesOf(talk, talks, config).length > 0);
}

export function conflictCountByDay(talks: Talk[], config: TimelineData): Map<string, number> {
    const counts = new Map<string, number>();
    for (const talk of conflictingTalks(talks, config)) {
        counts.set(talk.dayId!, (counts.get(talk.dayId!) ?? 0) + 1);
    }
    return counts;
}

/** Première heure libre d'une salle pour une intervention, ou `null` si la salle est complète. */
export function firstFreeStart(talk: Talk,
                               talks: Talk[],
                               config: TimelineData,
                               dayId: string | null,
                               roomId: string | null): number | null {
    const starts = freeStarts(talk, talks, config, dayId, roomId);
    return starts.length > 0 ? starts[0] : null;
}
