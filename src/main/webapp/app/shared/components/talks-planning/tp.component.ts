import {
    Component,
    computed,
    effect,
    ElementRef,
    input,
    model,
    QueryList,
    signal,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import {CdkDragEnd, CdkDragMove, DragDropModule} from '@angular/cdk/drag-drop';
import {FormsModule} from '@angular/forms';
import {TabsModule} from 'primeng/tabs';
import {TimelineModule} from 'primeng/timeline';
import {BadgeModule} from 'primeng/badge';
import {ToggleSwitchModule} from 'primeng/toggleswitch';
import {MenuItem} from 'primeng/api';
import {TranslateModule} from '@ngx-translate/core';

import {Talk, TalkSlotComponent} from '../talk-slot/talk-slot.component';
import {CardComponent} from '../card/card.component';
import {DialogBoxComponent} from '../dialog-box/dialog-box.component';
import {MenuBoxComponent} from '../menu-box/menu-box.component';
import {ButtonBoxComponent} from '../button-box/button-box.component';

import {TimelineDay} from './model/timeline-day';
import {TimelineRoom} from './model/timeline-room';
import {TimelineData} from './model/timeline-data';
import {IntervalMinutes} from './model/interval-minutes';

import {
    TpConfigRoomsComponent
} from './tp-config-rooms/tp-config-rooms.component';
import {
    TpConfigDayComponent
} from './tp-config-day/tp-config-day.component';

type RoomBounds = { start: number; end: number };
type HoverRange = { roomId: string; start: number; end: number };

@Component({
    selector: 'timeline-talks',
    imports: [
        DragDropModule,
        FormsModule,
        TabsModule,
        TimelineModule,
        BadgeModule,
        ToggleSwitchModule,
        TalkSlotComponent,
        CardComponent,
        TranslateModule,
        DialogBoxComponent,
        TpConfigRoomsComponent,
        TpConfigDayComponent,
        MenuBoxComponent,
        ButtonBoxComponent,
    ],
    templateUrl: './tp.component.html',
    styleUrl: './tp.component.scss',
})
export class TpComponent {
    @ViewChildren('roomTrack') private roomTracks!: QueryList<ElementRef<HTMLDivElement>>;

    configuration = model.required<TimelineData>();
    talks = model.required<Talk[]>();
    editionMode = input<boolean>(false);

    showGrid = signal(true);
    selectedDayId = signal<string | null>(null);

    showManageRooms = model<boolean>(false);
    showAssignRooms = model<boolean>(false);
    showConfirmDeleteDay = signal(false);

    manageDaySelectedDayId = signal<string | null>(null);
    manageDayCreateMode = signal(false);

    @ViewChild(TpConfigRoomsComponent) private roomsDialog?: TpConfigRoomsComponent;
    @ViewChild(TpConfigDayComponent) private assignDialog?: TpConfigDayComponent;

    readonly days = computed(() => this.configuration().days ?? []);
    readonly intervalMin = computed(() => this.configuration().intervalMinutes);

    readonly roomsById = computed(() => {
        const rooms = this.configuration().rooms ?? [];
        return new Map<string, TimelineRoom>(rooms.map(r => [r.id, r]));
    });

    readonly selectedDay = computed(() => {
        const days = this.days();
        if (!days.length) return null;

        const id = this.selectedDayId();
        return days.find(d => d.id === id) ?? days[0];
    });

    readonly dayMenus = computed(() => new Map(this.days().map(d => [d.id, this.dayActionItems(d.id)])));

    readonly roomsFromSelectedDay = computed(() => this.selectedDay()?.rooms ?? []);

    readonly rangeSelectedDay = computed(() => {
        const rooms = this.roomsFromSelectedDay();
        if (!rooms.length) return null;

        return rooms.reduce(
            (acc, r) => ({
                minStart: r.startingHour < acc.minStart ? r.startingHour : acc.minStart,
                maxEnd: r.endingHour > acc.maxEnd ? r.endingHour : acc.maxEnd,
            }),
            {minStart: rooms[0].startingHour, maxEnd: rooms[0].endingHour},
        );
    });

    readonly maxWidthPerHour = signal(240);
    readonly slotWidthPx = computed(() => (this.maxWidthPerHour() * this.intervalMin()) / 60);

    readonly timeSlots = computed(() => {
        const r = this.rangeSelectedDay();
        return r ? this.buildTimeSlots(r.minStart, r.maxEnd, this.intervalMin()) : [];
    });

    readonly gridColumns = computed(() => `repeat(${this.timeSlots().length}, ${this.slotWidthPx()}px)`);

    readonly roomBoundariesById = computed(() => {
        const r = this.rangeSelectedDay();
        const interval = this.intervalMin();

        const map = new Map<string, RoomBounds>();
        if (!r) return map;

        const daySlots = this.countIntervals(r.minStart, r.maxEnd, interval);

        for (const room of this.roomsFromSelectedDay()) {
            const roomSlots = this.countIntervals(room.startingHour, room.endingHour, interval);
            const start = this.clamp(this.slotIndexFromGlobalStart(room.startingHour, r.minStart, interval), 0, daySlots);
            const end = this.clamp(start + roomSlots, start, daySlots);
            map.set(room.roomId, {start, end});
        }

        return map;
    });

    readonly talksByRoom = computed(() => {
        const dayId = this.selectedDay()?.id;
        const map = new Map<string, Talk[]>();
        if (!dayId) return map;

        for (const t of this.talks()) {
            if (t.dayId !== dayId || !t.roomId) continue;
            (map.get(t.roomId) ?? map.set(t.roomId, []).get(t.roomId)!).push(t);
        }

        for (const list of map.values()) {
            list.sort((a, b) => (a.startSlot ?? 0) - (b.startSlot ?? 0) || a.id.localeCompare(b.id));
        }

        return map;
    });

    readonly unassignedTalks = computed(() => this.talks().filter(t => !t.dayId || !t.roomId));

    hoveredTalk = signal<Talk | null>(null);
    hoveredRoomId = signal<string | null>(null);
    hoveredStartSlot = signal<number | null>(null);

    readonly hoverRange = computed<HoverRange | null>(() => {
        const roomId = this.hoveredRoomId();
        const start = this.hoveredStartSlot();
        const talk = this.hoveredTalk();
        if (!roomId || start == null || !talk) return null;

        return {roomId, start, end: start + this.getTalkNbPeriods(talk)};
    });

    constructor() {
        effect(() => this.ensureSelectedDayId());
        effect(() => this.sanitizeTalkAssignments());
        effect(() => this.unassignTalksOutsideBounds());
    }

    private ensureSelectedDayId(): void {
        const days = this.days();
        const current = this.selectedDayId();

        if (!days.length) {
            if (current != null) this.selectedDayId.set(null);
            return;
        }

        if (!current || !days.some(d => d.id === current)) {
            this.selectedDayId.set(days[0].id);
        }
    }

    private sanitizeTalkAssignments(): void {
        const days = this.days();
        const dayIds = new Set(days.map(d => d.id));
        const roomIds = new Set(this.roomsById().keys());

        const roomsByDayId = new Map<string, Set<string>>(
            days.map(d => [d.id, new Set((d.rooms ?? []).map(r => r.roomId))]),
        );

        // Keeps data consistent when configuration changes.
        this.talks.update(ts =>
            ts.map(t => {
                if (t.dayId && !dayIds.has(t.dayId)) return this.unassignTalk(t);
                if (t.roomId && !roomIds.has(t.roomId)) return this.unassignTalk(t);
                if (t.dayId && t.roomId && !roomsByDayId.get(t.dayId)?.has(t.roomId)) return this.unassignTalk(t);
                return t;
            }),
        );
    }

    private unassignTalksOutsideBounds(): void {
        const day = this.selectedDay();
        const boundsByRoomId = this.roomBoundariesById();
        const current = this.talks(); // dependency on talks

        if (!day) return;

        let changed = false;

        const next = current.map(t => {
            if (t.dayId !== day.id || !t.roomId) return t;

            const b = boundsByRoomId.get(t.roomId);
            if (!b) {
                changed = true;
                return this.unassignTalk(t);
            }

            const periods = this.getTalkNbPeriods(t);
            const start = t.startSlot ?? b.start;
            const end = start + periods;

            if (start < b.start || end > b.end) {
                changed = true;
                return this.unassignTalk(t);
            }

            return t;
        });

        if (changed) this.talks.set(next);
    }

    private unassignTalk(t: Talk): Talk {
        return {...t, roomId: null, dayId: null, startSlot: 0};
    }

    getTalkStartTimeLabel(talk: Talk): string {
        const r = this.rangeSelectedDay();
        if (!r) return '';

        const base = new Date(r.minStart);
        base.setMinutes(base.getMinutes() + (talk.startSlot ?? 0) * this.intervalMin());

        return this.hhmm(base);
    }

    getTalkNbPeriods(talk: Talk | null): number {
        if (!talk) return 1;
        return Math.max(1, Math.ceil(talk.durationTotalMinutes / this.intervalMin()));
    }

    onTalkDragMoved(event: CdkDragMove, talk: Talk): void {
        const dragRect = event.source.element.nativeElement.getBoundingClientRect();
        const {room, rect} = this.findTargetRoom(dragRect);

        if (!room || !rect) return this.clearHover();

        const res = this.computeDropSlot(dragRect, rect, talk, room.id);
        if (!res.ok) return this.clearHover();

        this.hoveredRoomId.set(room.id);
        this.hoveredStartSlot.set(res.slot);
        this.hoveredTalk.set(talk);
    }

    onTalkDragEnded(event: CdkDragEnd, talk: Talk, day: TimelineDay | null): void {
        if (!day) return;

        const dragRect = event.source.element.nativeElement.getBoundingClientRect();
        const {room, rect} = this.findTargetRoom(dragRect);

        event.source.reset();

        if (!room || !rect) {
            this.talks.update(ts => ts.map(t => (t.id === talk.id ? this.unassignTalk(t) : t)));
            return this.clearHover();
        }

        const res = this.computeDropSlot(dragRect, rect, talk, room.id);
        if (!res.ok) return this.clearHover();

        this.placeTalkInRoom(talk, day.id, room.id, res.slot);
        this.clearHover();
    }

    private computeDropSlot(
        dragRect: DOMRect,
        roomRect: DOMRect,
        talk: Talk,
        roomId: string,
    ): { slot: number; ok: boolean } {
        const b = this.getRoomBounds(roomId);
        const periods = this.getTalkNbPeriods(talk);

        if ((b.end - b.start) < periods) return {slot: b.start, ok: false};

        const midX = dragRect.left + dragRect.width / 2;
        const relativeX = midX - roomRect.left;

        const raw = Math.round(relativeX / this.slotWidthPx() - periods / 2);
        const min = b.start;
        const max = b.end - periods;

        if (raw < min || raw > max) return {slot: this.clamp(raw, min, max), ok: false};
        return {slot: raw, ok: true};
    }

    private findTargetRoom(dragRect: DOMRect): { room: TimelineRoom | null; rect: DOMRect | null } {
        const midY = dragRect.top + dragRect.height / 2;

        for (const t of this.roomTracks.toArray()) {
            const el = t.nativeElement;
            const rect = el.getBoundingClientRect();

            if (midY < rect.top || midY > rect.bottom) continue;

            const roomId = el.dataset['roomId'];
            if (!roomId) continue;

            return {room: this.roomsById().get(roomId) ?? null, rect};
        }

        return {room: null, rect: null};
    }

    private placeTalkInRoom(talk: Talk, dayId: string, roomId: string, startSlot: number): void {
        const current = this.talks();

        const placed = current.map(t =>
            t.id === talk.id ? {...t, dayId, roomId, startSlot} : t,
        );

        const {talks: resolved, overflow} = this.resolveRoomCollisions(placed, roomId, dayId);
        if (!overflow) this.talks.set(resolved);
    }

    private resolveRoomCollisions(allTalks: Talk[], roomId: string, dayId: string): {
        talks: Talk[];
        overflow: boolean
    } {
        const roomTalks = allTalks
            .filter(t => t.roomId === roomId && t.dayId === dayId)
            .slice()
            .sort((a, b) => (a.startSlot ?? 0) - (b.startSlot ?? 0) || a.id.localeCompare(b.id));

        const bounds = this.getRoomBounds(roomId);
        const updated = new Map<string, Talk>();

        let cursor = bounds.start;

        for (const talk of roomTalks) {
            const periods = this.getTalkNbPeriods(talk);
            const desired = talk.startSlot ?? bounds.start;

            const start = Math.max(desired, cursor, bounds.start);
            const end = start + periods;

            if (end > bounds.end) return {talks: allTalks, overflow: true};

            cursor = end;
            updated.set(talk.id, {...talk, startSlot: start});
        }

        return {talks: allTalks.map(t => updated.get(t.id) ?? t), overflow: false};
    }

    private buildTimeSlots(start: Date, end: Date, interval: IntervalMinutes): string[] {
        const count = this.countIntervals(start, end, interval);

        const out: string[] = [];
        const cursor = new Date(start);

        for (let i = 0; i < count; i++) {
            out.push(this.hhmm(cursor));
            cursor.setMinutes(cursor.getMinutes() + interval);
        }

        return out;
    }

    private countIntervals(start: Date, end: Date, intervalMin: number): number {
        const diff = end.getTime() - start.getTime();
        if (diff <= 0) return 0;

        const intervalMs = intervalMin * 60_000;
        return Math.floor(diff / intervalMs);
    }

    private slotIndexFromGlobalStart(target: Date, base: Date, intervalMin: number): number {
        const diffMs = target.getTime() - base.getTime();
        return Math.floor(diffMs / (intervalMin * 60_000));
    }

    private getRoomBounds(roomId: string): RoomBounds {
        return this.roomBoundariesById().get(roomId) ?? {start: 0, end: this.timeSlots().length};
    }

    private clamp(n: number, min: number, max: number): number {
        return Math.min(Math.max(n, min), max);
    }

    private hhmm(d: Date): string {
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    private clearHover(): void {
        this.hoveredRoomId.set(null);
        this.hoveredStartSlot.set(null);
        this.hoveredTalk.set(null);
    }

    addNewDay(): void {
        this.manageDayCreateMode.set(true);
        this.manageDaySelectedDayId.set(this.newId());
        this.showAssignRooms.set(true);
    }

    onManageDayConfirm(next: any /* TimelineData */): void {
        const createdId = this.manageDaySelectedDayId();

        this.configuration.set(next);
        this.showAssignRooms.set(false);

        if (this.manageDayCreateMode() && createdId) {
            this.selectedDayId.set(createdId);
        }

        this.manageDayCreateMode.set(false);
        this.manageDaySelectedDayId.set(null);
    }

    onManageDayCancel(): void {
        this.showAssignRooms.set(false);
        this.manageDayCreateMode.set(false);
        this.manageDaySelectedDayId.set(null);
    }

    private newId(): string {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
        return 'id_' + Math.random().toString(16).slice(2) + Date.now().toString(16);
    }

    dayActionItems(dayId: string): MenuItem[] {
        return [
            {
                label: 'Configuration',
                icon: 'pi pi-calendar',
                command: () => this.openManageSelectedDay(dayId),
            },
            {
                label: 'Supprimer le jour',
                icon: 'pi pi-trash',
                styleClass: 'p-menuitem-danger',
                command: () => this.openDeleteDayConfirm(),
            },
        ];
    }

    openManageSelectedDay(dayId: string): void {
        this.manageDayCreateMode.set(false);
        this.manageDaySelectedDayId.set(dayId);
        this.showAssignRooms.set(true);
    }

    openDeleteDayConfirm(): void {
        this.showConfirmDeleteDay.set(true);
    }

    confirmDeleteSelectedDay(): void {
        const dayId = this.selectedDay()?.id;
        if (!dayId) return;

        // Remove day
        this.configuration.update(cfg => ({
            ...cfg,
            days: (cfg.days ?? []).filter(d => d.id !== dayId),
        }));

        // Unassign talks for that day (keeps data consistent)
        this.talks.update(ts => ts.map(t => (t.dayId === dayId ? this.unassignTalk(t) : t)));

        this.showConfirmDeleteDay.set(false);
    }

    roomsPanelConfirm(): void {
        this.roomsDialog?.confirm();
    }

    assignPanelConfirm(): void {
        this.assignDialog?.confirm();
    }
}