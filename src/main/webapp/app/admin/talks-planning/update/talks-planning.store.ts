import {computed, inject, Injectable, signal} from '@angular/core';
import {forkJoin, map} from 'rxjs';
import {finalize} from 'rxjs/operators';

import {SalonService} from '../../salon/service/salon.service';
import {ConferenceService} from '../../conference/service/conference.service';
import {WorkshopService} from '../../workshop/service/workshop.service';
import {ActionsService} from '../../common/actions.service';
import {MenuItemBuilderService} from '../../../shared/utils/menu-item-builder.service';
import {AvailableAction} from '../../../shared/model/available-action';
import {AppMenuItem} from '../../../shared/utils/app-menu-item.model';
import {Status} from '../../enumerations/status.model';

import {
    buildEmptyConfiguration,
    cloneConfiguration,
    configurationFromDto,
    configurationToDto,
    isPlaced,
    mergePlacements,
    PlanningTalksDto,
    syncTalkDurations,
    Talk,
    talkKey,
    talkToDto,
    TalkType,
    TimelineData,
    TimelineDay,
    toTalk
} from './talks-planning-model';
import {
    conflictCountByDay,
    conflictingTalks,
    ConflictReason,
    issuesOf,
    roomBounds,
    slotCandidates as computeSlotCandidates,
    SlotCandidates,
    unplacedTalks
} from './talks-planning-utils';

const HISTORY_LIMIT = 60;

export type TrayFilter = 'ALL' | 'CONFERENCE' | 'WORKSHOP';

export interface SelectedSlot {
    dayId: string;
    roomId: string;
    startMinute: number;
}

/** Message éphémère à afficher par la page (traduction faite côté UI). */
export interface PlanningToast {
    key: string;
    params?: Record<string, string | number>;
    /** Raison de conflit à concaténer au message. */
    reason?: ConflictReason;
    /** Propose « Annuler » dans le toast. */
    undoable?: boolean;
}

interface Snapshot {
    configuration: TimelineData;
    talks: Talk[];
}

@Injectable()
export class TalksPlanningStore {
    readonly configuration = signal<TimelineData | null>(null);
    readonly talks = signal<Talk[]>([]);
    readonly isReadOnly = signal<boolean>(true);
    readonly isLoading = signal<boolean>(false);

    readonly selectedDayId = signal<string | null>(null);
    readonly mobileRoomId = signal<string | null>(null);
    readonly talkInHand = signal<string | null>(null);
    readonly selectedSlot = signal<SelectedSlot | null>(null);
    readonly selectedTalkKey = signal<string | null>(null);
    readonly focusTherapist = signal<string | null>(null);
    readonly panelFolded = signal<boolean>(false);
    readonly showConflicts = signal<boolean>(false);
    readonly trayFilter = signal<TrayFilter>('ALL');
    readonly trayQuery = signal<string>('');
    readonly menuItems = signal<AppMenuItem[]>([]);
    readonly toast = signal<PlanningToast | null>(null);

    private readonly salonService = inject(SalonService);
    private readonly conferenceService = inject(ConferenceService);
    private readonly workshopService = inject(WorkshopService);
    private readonly actionsService = inject(ActionsService);
    private readonly menuItemBuilderService = inject(MenuItemBuilderService);

    private readonly history = signal<Snapshot[]>([]);
    private idSalon = '';

    // ---------- computed ----------

    readonly isEditing = computed(() => !this.isReadOnly());

    readonly hasConfiguration = computed(() => (this.configuration()?.days.length ?? 0) > 0);

    readonly days = computed<TimelineDay[]>(() => this.configuration()?.days ?? []);
    readonly selectedDay = computed<TimelineDay | null>(() => {
        const days = this.days();
        if (days.length === 0) {
            return null;
        }
        return days.find(day => day.id === this.selectedDayId()) ?? days[0];
    });

    /** Toutes les salles du salon, avec leur état d'ouverture pour le jour affiché. */
    readonly gridRooms = computed(() => {
        const config = this.configuration();
        const day = this.selectedDay();
        if (!config || !day) {
            return [];
        }
        return config.rooms.map(room => ({
            room,
            bounds: roomBounds(config, day.id, room.id)
        }));
    });

    readonly mobileRoom = computed(() => {
        const rooms = this.gridRooms();
        if (rooms.length === 0) {
            return null;
        }
        return rooms.find(entry => entry.room.id === this.mobileRoomId()) ?? rooms[0];
    });

    readonly unplaced = computed<Talk[]>(() => unplacedTalks(this.talks()));

    readonly unplacedCount = computed(() => this.unplaced().length);

    readonly conflicts = computed<Talk[]>(() => {
        const config = this.configuration();
        return config ? conflictingTalks(this.talks(), config) : [];
    });

    readonly conflictsByDay = computed<Map<string, number>>(() => {
        const config = this.configuration();
        return config ? conflictCountByDay(this.talks(), config) : new Map<string, number>();
    });

    readonly canUndo = computed(() => this.history().length > 0);

    readonly talkInHandValue = computed<Talk | null>(() => this.findTalk(this.talkInHand()));

    readonly selectedTalk = computed<Talk | null>(() => this.findTalk(this.selectedTalkKey()));

    readonly dayTalks = computed<Talk[]>(() => {
        const dayId = this.selectedDay()?.id;
        return dayId ? this.talks().filter(talk => isPlaced(talk) && talk.dayId === dayId) : [];
    });

    readonly trayTalks = computed<Talk[]>(() => {
        const filter = this.trayFilter();
        const query = this.trayQuery().trim().toLowerCase();
        return this.unplaced().filter(talk => {
            if (filter !== 'ALL' && talk.type !== filter) {
                return false;
            }
            if (!query) {
                return true;
            }
            return talk.title.toLowerCase().includes(query)
                || talk.participation.therapistName.toLowerCase().includes(query);
        });
    });

    readonly trayCounts = computed(() => {
        const unplaced = this.unplaced();
        return {
            ALL: unplaced.length,
            CONFERENCE: unplaced.filter(talk => talk.type === 'CONFERENCE').length,
            WORKSHOP: unplaced.filter(talk => talk.type === 'WORKSHOP').length
        };
    });

    readonly slotCandidates = computed<SlotCandidates | null>(() => {
        const config = this.configuration();
        const slot = this.selectedSlot();
        if (!config || !slot) {
            return null;
        }
        return computeSlotCandidates(this.talks(), config, slot.dayId, slot.roomId, slot.startMinute);
    });

    // ---------- chargement / sauvegarde ----------

    load(idSalon: string, onLoaded?: () => void): void {
        this.idSalon = idSalon;
        this.isLoading.set(true);

        forkJoin({
                     planning: this.salonService.getPlanningTalks(idSalon),
                     conferences: this.conferenceService.query({idSalon}).pipe(
                         map(items => items.filter(item => item.status !== Status.REFUSED && item.status !== Status.CANCELED))),
                     workshops: this.workshopService.query({idSalon}).pipe(
                         map(items => items.filter(item => item.status !== Status.REFUSED && item.status !== Status.CANCELED)))
                 })
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(({planning, conferences, workshops}) => {
                const configuration: TimelineData = planning?.configuration
                                                    ? configurationFromDto(planning.configuration)
                                                    : buildEmptyConfiguration(idSalon);

                const baseTalks: Talk[] = [
                    ...conferences.map(item => toTalk(item, 'CONFERENCE', configuration.talkTypes.CONFERENCE)),
                    ...workshops.map(item => toTalk(item, 'WORKSHOP', configuration.talkTypes.WORKSHOP))
                ];

                this.configuration.set(configuration);
                this.talks.set(this.sanitize(mergePlacements(baseTalks, planning?.talks ?? [], configuration), configuration));
                this.history.set([]);
                this.resetTransientState();
                this.ensureSelectedDay();
                this.loadAvailableActions();
                onLoaded?.();
            });
    }

    save(onSaved?: () => void): void {
        const configuration = this.configuration();
        if (!configuration) {
            return;
        }
        const payload: PlanningTalksDto = {
            configuration: configurationToDto(configuration),
            talks: this.talks().map(talk => talkToDto(talk, configuration))
        };

        this.isLoading.set(true);
        this.salonService.savePlanningTalks(this.idSalon, payload)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(() => {
                this.history.set([]);
                onSaved?.();
            });
    }

    private loadAvailableActions(): void {
        if (!this.idSalon) {
            return;
        }
        this.actionsService.getAvailableActions('salon', this.idSalon, 'talks-planning')
            .subscribe(actions => {
                this.menuItems.set(this.menuItemBuilderService.buildMenuItemsFromActions(
                    actions, (action, element) => this.clickAction(action, element)));
            });
    }

    clickAction(action: AvailableAction, _htmlElement?: HTMLElement): void {
        if (action.type !== 'DOWNLOAD') {
            console.warn('Action type unknown : ' + action.type);
            return;
        }
        this.isLoading.set(true);
        this.actionsService.downloadAction(action.contextCode, this.idSalon)
            .pipe(finalize(() => this.isLoading.set(false)))
            .subscribe(res => {
                const cd = res.headers.get('content-disposition') ?? '';
                const filename = this.getFilenameFromContentDisposition(cd) ?? 'planning.pdf';

                const url = window.URL.createObjectURL(res.body!);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                window.URL.revokeObjectURL(url);
            });
    }

    private getFilenameFromContentDisposition(cd: string): string | null {
        if (!cd) {
            return null;
        }
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(cd);
        return matches?.[1] ? matches[1].replace(/['"]/g, '') : null;
    }

    // ---------- modes ----------

    activateEditMode(): void {
        this.isReadOnly.set(false);
        this.history.set([]);
        this.resetTransientState();
    }

    activateReadOnlyMode(): void {
        this.isReadOnly.set(true);
        this.history.set([]);
        this.resetTransientState();
        this.load(this.idSalon);
    }

    resetTransientState(): void {
        this.talkInHand.set(null);
        this.selectedSlot.set(null);
        this.selectedTalkKey.set(null);
        this.focusTherapist.set(null);
        this.showConflicts.set(false);
        this.toast.set(null);
    }

    selectDay(dayId: string): void {
        if (dayId === this.selectedDay()?.id) {
            return;
        }
        this.selectedDayId.set(dayId);
        // L'intervention en main et le filtre du bac sont conservés en changeant de jour.
        this.selectedSlot.set(null);
        this.selectedTalkKey.set(null);
    }

    private ensureSelectedDay(): void {
        const days = this.days();
        if (days.length === 0) {
            this.selectedDayId.set(null);
            this.mobileRoomId.set(null);
            return;
        }
        if (!days.some(day => day.id === this.selectedDayId())) {
            this.selectedDayId.set(days[0].id);
        }
        const rooms = this.gridRooms();
        if (!rooms.some(entry => entry.room.id === this.mobileRoomId())) {
            this.mobileRoomId.set(rooms[0]?.room.id ?? null);
        }
    }

    // ---------- placement ----------

    findTalk(key: string | null): Talk | null {
        return key ? this.talks().find(talk => talkKey(talk) === key) ?? null : null;
    }

    issuesOfTalk(talk: Talk): ConflictReason[] {
        const config = this.configuration();
        return config ? issuesOf(talk, this.talks(), config) : [];
    }

    /**
     * Place une intervention. Refuse seulement si la salle est fermée ce jour-là :
     * un conflit est signalé mais n'empêche pas le placement.
     */
    place(key: string, dayId: string, roomId: string, startMinute: number): boolean {
        const config = this.configuration();
        if (!config || this.isReadOnly()) {
            return false;
        }
        if (!roomBounds(config, dayId, roomId)) {
            this.toast.set({key: 'planningTalks.conflict.closedRoom'});
            return false;
        }

        this.pushHistory();
        const next = this.talks().map(talk => talkKey(talk) === key ? {...talk, dayId, roomId, startMinute} : talk);
        this.talks.set(next);

        const placed = next.find(talk => talkKey(talk) === key)!;
        const reasons = issuesOf(placed, next, config);
        if (reasons.length > 0) {
            this.toast.set({key: 'planningTalks.conflict.placedWithConflict', reason: reasons[0]});
        } else {
            this.toast.set({
                               key: 'planningTalks.placed',
                               params: {title: placed.title, time: this.hhmm(startMinute)},
                               undoable: true
                           });
        }
        return true;
    }

    unplace(key: string): void {
        if (this.isReadOnly()) {
            return;
        }
        this.pushHistory();
        this.talks.set(this.talks().map(
            talk => talkKey(talk) === key ? {...talk, dayId: null, roomId: null, startMinute: null} : talk));
    }

    takeInHand(key: string): void {
        if (this.isReadOnly()) {
            return;
        }
        this.talkInHand.set(key);
        this.selectedSlot.set(null);
        this.panelFolded.set(false);
    }

    dropInHand(): void {
        this.talkInHand.set(null);
    }

    selectSlot(slot: SelectedSlot | null): void {
        this.selectedSlot.set(slot);
        if (slot) {
            this.selectedTalkKey.set(null);
            this.panelFolded.set(false);
        }
    }

    selectTalk(key: string | null): void {
        this.selectedTalkKey.set(key);
        if (key) {
            this.selectedSlot.set(null);
            this.panelFolded.set(false);
        }
    }

    // ---------- configuration ----------

    /**
     * Applique une nouvelle configuration : recalcule les durées, renvoie dans « À planifier »
     * les interventions dont le jour ou la salle a disparu, et signale les conflits restants.
     */
    applyConfiguration(next: TimelineData): void {
        this.pushHistory();
        const talks = this.sanitize(syncTalkDurations(this.talks(), next), next);
        this.configuration.set(next);
        this.talks.set(talks);
        this.ensureSelectedDay();
        this.selectedSlot.set(null);

        const conflicts = conflictingTalks(talks, next).length;
        this.toast.set(conflicts > 0
                       ? {key: 'planningTalks.config.appliedWithConflicts', params: {count: conflicts}}
                       : {key: 'planningTalks.config.applied'});
    }

    /** Une intervention dont le jour ou la salle n'existe plus revient dans « À planifier ». */
    private sanitize(talks: Talk[], config: TimelineData): Talk[] {
        return talks.map(talk => {
            if (!isPlaced(talk)) {
                return talk;
            }
            return roomBounds(config, talk.dayId, talk.roomId)
                   ? talk
                   : {...talk, dayId: null, roomId: null, startMinute: null};
        });
    }

    // ---------- historique ----------

    private pushHistory(): void {
        const config = this.configuration();
        if (!config) {
            return;
        }
        const history = [...this.history(), {configuration: cloneConfiguration(config), talks: this.talks()}];
        if (history.length > HISTORY_LIMIT) {
            history.shift();
        }
        this.history.set(history);
    }

    undo(): boolean {
        const history = [...this.history()];
        const previous = history.pop();
        if (!previous) {
            return false;
        }
        this.history.set(history);
        this.configuration.set(previous.configuration);
        this.talks.set(previous.talks);
        this.ensureSelectedDay();
        this.selectedSlot.set(null);
        this.toast.set(null);
        return true;
    }

    // ---------- divers ----------

    private hhmm(minute: number): string {
        const h = Math.floor(minute / 60);
        const m = minute % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
}
