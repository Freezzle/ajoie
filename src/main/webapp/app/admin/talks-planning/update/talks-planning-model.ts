import {Status} from '../../enumerations/status.model';
import {IConference} from '../../conference/model/conference.interface';
import {IWorkshop} from '../../workshop/model/workshop.interface';
import {getExhibitorFullName} from '../../exhibitor/model/exhibitor.interface';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Pas de la salle : lignes affichées dans la grille. */
export type DisplayIntervalMinutes = 15 | 30 | 60;

/** Pas de placement : heures de début possibles. */
export type PlacementIntervalMinutes = 5 | 10 | 15 | 30;

export type TalkType = 'CONFERENCE' | 'WORKSHOP';

export const TALK_TYPES: TalkType[] = ['CONFERENCE', 'WORKSHOP'];

export const DISPLAY_INTERVALS: DisplayIntervalMinutes[] = [15, 30, 60];
export const PLACEMENT_INTERVALS: PlacementIntervalMinutes[] = [5, 10, 15, 30];

export interface TalkTypeConfig {
    /** Durée de l'intervention, celle qui est affichée au public. */
    durationTalkMinutes: number;
    /** Battement avant l'heure de début. */
    preparationMinutes: number;
    /** Battement après la fin. */
    cleanupMinutes: number;
}

export interface TimelineRoom {
    id: string;
    label: string;
}

export interface TimelineRoomData {
    roomId: string;
    startingHour: Date;
    endingHour: Date;
}

export interface TimelineDay {
    id: string;
    label: string;
    rooms: TimelineRoomData[];
}

export interface TimelineData {
    eventId: string;
    intervalMinutes: DisplayIntervalMinutes;
    placementIntervalMinutes: PlacementIntervalMinutes;
    talkTypes: Record<TalkType, TalkTypeConfig>;
    days: TimelineDay[];
    rooms: TimelineRoom[];
}

export interface Talk {
    id: string;
    type: TalkType;
    title: string;
    description: string;
    status: Status;
    extraInformation: string | null;
    participation: { therapistName: string; fullName: string | null };
    // placement
    dayId: string | null;
    roomId: string | null;
    /** Minutes depuis minuit, heure locale du salon (ex. 11:45 -> 705). */
    startMinute: number | null;
    // durées dérivées de configuration.talkTypes[type]
    durationTalkMinutes: number;
    preparationMinutes: number;
    cleanupMinutes: number;
    /** préparation + durée + rangement */
    durationTotalMinutes: number;
}

// ---------------------------------------------------------------------------
// DTO
// ---------------------------------------------------------------------------

export interface TalkPlanningSaveDto {
    id: string;
    type: TalkType;
    dayId: string | null;
    roomId: string | null;
    /** ISO, même convention que TimelineRoomDataDto.startingHour. */
    startingHour: string | null;
    durationTalkMinutes: number;
    preparationMinutes: number;
    cleanupMinutes: number;
    durationTotalMinutes: number;
    /** @deprecated lu pour la reprise des plannings enregistrés avant la refonte. */
    startSlot?: number | null;
}

export interface TimelineRoomDto {
    id: string;
    label: string;
}

export interface TimelineRoomDataDto {
    roomId: string;
    startingHour: string;
    endingHour: string;
}

export interface TimelineDayDto {
    id: string;
    label: string;
    rooms: TimelineRoomDataDto[];
}

export interface TimelineDataDto {
    eventId: string;
    intervalMinutes: number;
    placementIntervalMinutes?: number | null;
    talkTypes?: Partial<Record<TalkType, TalkTypeConfig>> | null;
    days: TimelineDayDto[];
    rooms: TimelineRoomDto[];
}

export interface PlanningTalksDto {
    configuration: TimelineDataDto;
    talks: TalkPlanningSaveDto[];
}

// ---------------------------------------------------------------------------
// Valeurs par défaut
// ---------------------------------------------------------------------------

/** Nouvelle configuration : durées recommandées. */
export const DEFAULT_TALK_TYPES: Record<TalkType, TalkTypeConfig> = {
    CONFERENCE: {preparationMinutes: 0, durationTalkMinutes: 45, cleanupMinutes: 15},
    WORKSHOP: {preparationMinutes: 15, durationTalkMinutes: 60, cleanupMinutes: 15}
};

/**
 * Configuration existante sans ces champs : reproduit exactement les durées précédentes
 * (conférence 60 min, atelier 75 min) pour ne créer aucun conflit sur les plannings déjà enregistrés.
 */
export const LEGACY_TALK_TYPES: Record<TalkType, TalkTypeConfig> = {
    CONFERENCE: {preparationMinutes: 0, durationTalkMinutes: 45, cleanupMinutes: 15},
    WORKSHOP: {preparationMinutes: 0, durationTalkMinutes: 60, cleanupMinutes: 15}
};

export const DEFAULT_DISPLAY_INTERVAL: DisplayIntervalMinutes = 30;
export const DEFAULT_PLACEMENT_INTERVAL: PlacementIntervalMinutes = 15;

export const DEFAULT_ROOM_OPENING_MINUTE = 10 * 60;
export const DEFAULT_ROOM_CLOSING_MINUTE = 18 * 60;

export function buildEmptyConfiguration(eventId: string): TimelineData {
    return {
        eventId,
        intervalMinutes: DEFAULT_DISPLAY_INTERVAL,
        placementIntervalMinutes: DEFAULT_PLACEMENT_INTERVAL,
        talkTypes: cloneTalkTypes(DEFAULT_TALK_TYPES),
        days: [],
        rooms: []
    };
}

export function cloneTalkTypes(source: Record<TalkType, TalkTypeConfig>): Record<TalkType, TalkTypeConfig> {
    return {
        CONFERENCE: {...source.CONFERENCE},
        WORKSHOP: {...source.WORKSHOP}
    };
}

export function cloneConfiguration(config: TimelineData): TimelineData {
    return {
        eventId: config.eventId,
        intervalMinutes: config.intervalMinutes,
        placementIntervalMinutes: config.placementIntervalMinutes,
        talkTypes: cloneTalkTypes(config.talkTypes),
        rooms: config.rooms.map(room => ({...room})),
        days: config.days.map(day => ({
            id: day.id,
            label: day.label,
            rooms: day.rooms.map(room => ({
                roomId: room.roomId,
                startingHour: new Date(room.startingHour),
                endingHour: new Date(room.endingHour)
            }))
        }))
    };
}

// ---------------------------------------------------------------------------
// Temps : une seule paire de conversions pour rester cohérent avec le PDF
// ---------------------------------------------------------------------------

/** Minutes depuis minuit, en heure locale. */
export function minutesOfDay(date: Date): number {
    return date.getHours() * 60 + date.getMinutes();
}

/** Applique une heure (minutes depuis minuit) sur la date d'un jour donné. */
export function dateAtMinute(reference: Date, minute: number): Date {
    const result = new Date(reference);
    result.setHours(0, 0, 0, 0);
    result.setMinutes(minute);
    return result;
}

export function hhmm(minute: number): string {
    const normalized = Math.max(0, Math.round(minute));
    const h = Math.floor(normalized / 60);
    const m = normalized % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function newId(prefix: 'day' | 'room'): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function talkKey(talk: Pick<Talk, 'id' | 'type'>): string {
    return `${talk.type}:${talk.id}`;
}

export function isPlaced(talk: Talk): boolean {
    return talk.dayId !== null && talk.roomId !== null && talk.startMinute !== null;
}

/** Statuts « aboutis » : ils ne sont pas signalés dans le planning. */
const SETTLED_STATUSES: Status[] = [Status.ACCEPTED, Status.VALIDATED, Status.CLOSED];

export function isUnsettledStatus(status: Status): boolean {
    return !SETTLED_STATUSES.includes(status);
}

export function statusLabelKey(talk: Pick<Talk, 'type' | 'status'>): string {
    const namespace = talk.type === 'CONFERENCE' ? 'conference' : 'workshop';
    return `${namespace}.status.list.${talk.status}`;
}

// ---------------------------------------------------------------------------
// Mapping configuration
// ---------------------------------------------------------------------------

function toDisplayInterval(value: number | null | undefined): DisplayIntervalMinutes {
    // Le pas de 5 min n'existe plus comme pas d'affichage.
    if (value === 5 || value === 15) {
        return 15;
    }
    return value === 60 ? 60 : 30;
}

function toPlacementInterval(value: number | null | undefined): PlacementIntervalMinutes {
    return PLACEMENT_INTERVALS.includes(value as PlacementIntervalMinutes)
           ? (value as PlacementIntervalMinutes)
           : DEFAULT_PLACEMENT_INTERVAL;
}

function sanitizeTypeConfig(value: TalkTypeConfig | null | undefined, fallback: TalkTypeConfig): TalkTypeConfig {
    if (!value) {
        return {...fallback};
    }
    return {
        preparationMinutes: Math.max(0, value.preparationMinutes ?? fallback.preparationMinutes),
        durationTalkMinutes: Math.max(5, value.durationTalkMinutes ?? fallback.durationTalkMinutes),
        cleanupMinutes: Math.max(0, value.cleanupMinutes ?? fallback.cleanupMinutes)
    };
}

export function configurationFromDto(dto: TimelineDataDto): TimelineData {
    const legacy = LEGACY_TALK_TYPES;
    return {
        eventId: dto.eventId,
        intervalMinutes: toDisplayInterval(dto.intervalMinutes),
        placementIntervalMinutes: toPlacementInterval(dto.placementIntervalMinutes),
        talkTypes: {
            CONFERENCE: sanitizeTypeConfig(dto.talkTypes?.CONFERENCE, legacy.CONFERENCE),
            WORKSHOP: sanitizeTypeConfig(dto.talkTypes?.WORKSHOP, legacy.WORKSHOP)
        },
        days: (dto.days ?? []).map(day => ({
            id: day.id,
            label: day.label,
            rooms: (day.rooms ?? []).map(room => ({
                roomId: room.roomId,
                startingHour: new Date(room.startingHour),
                endingHour: new Date(room.endingHour)
            }))
        })),
        rooms: (dto.rooms ?? []).map(room => ({id: room.id, label: room.label}))
    };
}

export function configurationToDto(data: TimelineData): TimelineDataDto {
    return {
        eventId: data.eventId,
        intervalMinutes: data.intervalMinutes,
        placementIntervalMinutes: data.placementIntervalMinutes,
        talkTypes: cloneTalkTypes(data.talkTypes),
        days: data.days.map(day => ({
            id: day.id,
            label: day.label,
            rooms: day.rooms.map(room => ({
                roomId: room.roomId,
                startingHour: room.startingHour.toISOString(),
                endingHour: room.endingHour.toISOString()
            }))
        })),
        rooms: data.rooms.map(room => ({id: room.id, label: room.label}))
    };
}

// ---------------------------------------------------------------------------
// Mapping interventions
// ---------------------------------------------------------------------------

export function toTalk(source: IConference | IWorkshop, type: TalkType, config: TalkTypeConfig): Talk {
    return {
        id: String(source.id),
        type,
        title: source.title,
        description: source.description,
        status: source.status,
        extraInformation: source.extraInformation,
        participation: {
            therapistName: source.participation.therapistName,
            fullName: getExhibitorFullName(source.participation.exhibitor)
        },
        dayId: null,
        roomId: null,
        startMinute: null,
        ...derivedDurations(config)
    };
}

export function derivedDurations(config: TalkTypeConfig): Pick<Talk,
    'durationTalkMinutes' | 'preparationMinutes' | 'cleanupMinutes' | 'durationTotalMinutes'> {
    return {
        durationTalkMinutes: config.durationTalkMinutes,
        preparationMinutes: config.preparationMinutes,
        cleanupMinutes: config.cleanupMinutes,
        durationTotalMinutes: config.preparationMinutes + config.durationTalkMinutes + config.cleanupMinutes
    };
}

/** Recalcule les durées de toutes les interventions depuis la configuration. */
export function syncTalkDurations(talks: Talk[], config: TimelineData): Talk[] {
    return talks.map(talk => ({...talk, ...derivedDurations(config.talkTypes[talk.type])}));
}

/**
 * Première ouverture de salle d'un jour, en minutes depuis minuit.
 * C'est l'origine du `startSlot` tel que l'ancien écran le comptait.
 */
export function dayOpeningMinute(day: TimelineDay | undefined): number | null {
    if (!day || day.rooms.length === 0) {
        return null;
    }
    return Math.min(...day.rooms.map(room => minutesOfDay(room.startingHour)));
}

function startMinuteFromDto(dto: TalkPlanningSaveDto, config: TimelineData): number | null {
    if (!dto.dayId || !dto.roomId) {
        return null;
    }
    if (dto.startingHour) {
        return minutesOfDay(new Date(dto.startingHour));
    }
    // Reprise des plannings enregistrés avant la refonte : le slot était compté depuis la
    // première ouverture de salle du jour, c'est ce que l'utilisateur voyait à l'écran.
    const opening = dayOpeningMinute(config.days.find(day => day.id === dto.dayId));
    if (opening === null) {
        return null;
    }
    return opening + (dto.startSlot ?? 0) * config.intervalMinutes;
}

/** Fusionne les placements enregistrés dans les interventions chargées depuis les sources. */
export function mergePlacements(talks: Talk[], saved: TalkPlanningSaveDto[], config: TimelineData): Talk[] {
    const savedMap = new Map(saved.map(dto => [talkKey(dto), dto]));
    return talks.map(talk => {
        const dto = savedMap.get(talkKey(talk));
        if (!dto) {
            return talk;
        }
        const startMinute = startMinuteFromDto(dto, config);
        return startMinute === null
               ? {...talk, dayId: null, roomId: null, startMinute: null}
               : {...talk, dayId: dto.dayId, roomId: dto.roomId, startMinute};
    });
}

export function talkToDto(talk: Talk, config: TimelineData): TalkPlanningSaveDto {
    return {
        id: talk.id,
        type: talk.type,
        dayId: talk.dayId,
        roomId: talk.roomId,
        startingHour: startingHourOf(talk, config),
        durationTalkMinutes: talk.durationTalkMinutes,
        preparationMinutes: talk.preparationMinutes,
        cleanupMinutes: talk.cleanupMinutes,
        durationTotalMinutes: talk.durationTotalMinutes
    };
}

/** Date du jour (prise sur le `startingHour` de la salle ce jour-là) + `startMinute`. */
function startingHourOf(talk: Talk, config: TimelineData): string | null {
    if (!isPlaced(talk)) {
        return null;
    }
    const day = config.days.find(d => d.id === talk.dayId);
    const roomData = day?.rooms.find(r => r.roomId === talk.roomId) ?? day?.rooms[0];
    if (!roomData) {
        return null;
    }
    return dateAtMinute(roomData.startingHour, talk.startMinute!).toISOString();
}
