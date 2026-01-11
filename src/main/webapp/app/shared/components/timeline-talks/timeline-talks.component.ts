import {Component, computed, effect, ElementRef, input, model, QueryList, signal, ViewChildren,} from '@angular/core';
import {Talk, TalkSlotComponent} from '../talk-slot/talk-slot.component';
import {CdkDragEnd, CdkDragMove, DragDropModule} from '@angular/cdk/drag-drop';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TabsModule} from 'primeng/tabs';
import {TimelineModule} from 'primeng/timeline';
import {CardModule} from 'primeng/card';
import {BadgeModule} from 'primeng/badge';
import {ToggleSwitchModule} from "primeng/toggleswitch";
import {DialogModule} from "primeng/dialog";
import {TimelineConfigPanelComponent} from "./timeline-config-panel/timeline-config-panel.component";
import {ButtonDirective} from "primeng/button";
import {TimelineDay} from "./model/timeline-day";
import {TimelineRoom} from "./model/timeline-room";
import {TimelineData} from "./model/timeline-data";
import {IntervalMinutes} from "./model/interval-minutes";
import {CardComponent} from "../card/card.component";
import {TranslateModule} from "@ngx-translate/core";
import {DialogBoxComponent} from "../dialog-box/dialog-box.component";

@Component({
    selector: 'timeline-talks',
    imports: [
        DragDropModule,
        FormsModule,
        TabsModule,
        TimelineModule,
        CardModule,
        BadgeModule,
        ReactiveFormsModule,
        ToggleSwitchModule,
        DialogModule,
        ButtonDirective,
        TalkSlotComponent,
        TimelineConfigPanelComponent,
        CardComponent,
        TranslateModule,
        DialogBoxComponent,

    ],
    templateUrl: './timeline-talks.component.html',
    styleUrl: './timeline-talks.component.scss',
})
export class TimelineTalksComponent {
    @ViewChildren('roomTrack') roomTracks!: QueryList<ElementRef<HTMLDivElement>>;

    configuration = model.required<TimelineData>();
    talks = model.required<Talk[]>();
    editionMode = input<boolean>(false);

    // State management
    showGrid = signal<boolean>(true);
    showConfiguration = signal<boolean>(false);

    readonly roomBoundariesById = computed(() => {
        const range = this.rangeSelectedDay();
        const interval = this.configuration().intervalMinutes;

        const map = new Map<string, RoomBounds>();
        if (!range) {
            return map;
        }

        const nbDaySlots = this.countIntervals(range.minStart, range.maxEnd, interval);

        for (const room of this.roomsFromSelectedDay()) {
            const nbRoomSlots = this.countIntervals(room.startingHour, room.endingHour, interval);

            const startingSlot = this.clamp(this.slotIndexFromGlobalStart(room.startingHour, range.minStart, interval), 0, nbDaySlots);
            const endingSlot = this.clamp(startingSlot + nbRoomSlots, startingSlot, nbDaySlots)
            map.set(room.roomId, {start: startingSlot, end: endingSlot});
        }

        return map;
    });

    readonly days = computed(() => this.configuration().days ?? []);
    readonly rooms = computed(() => this.configuration().rooms ?? []);
    readonly selectedDayId = signal<string | null>(null);

    readonly selectedDay = computed(() => {
        const days = this.days();
        if (!days.length) {
            return null;
        }

        const id = this.selectedDayId();
        return days.find(d => d.id === id) ?? days[0];
    });

    readonly roomsFromSelectedDay = computed(() => this.selectedDay()?.rooms ?? []);

    readonly roomsById = computed(() => {
        const map = new Map<string, TimelineRoom>();
        for (const room of this.configuration().rooms) {
            map.set(room.id, room);
        }
        return map;
    });

    readonly rangeSelectedDay = computed(() => {
        const rooms = this.roomsFromSelectedDay();
        if (!rooms.length) {
            return null;
        }

        let minStart = rooms[0].startingHour;
        let maxEnd = rooms[0].endingHour;

        for (const r of rooms) {
            if (r.startingHour < minStart) {
                minStart = r.startingHour;
            }
            if (r.endingHour > maxEnd) {
                maxEnd = r.endingHour;
            }
        }

        return {minStart, maxEnd};
    });

    readonly maxWidthPerHour = signal<number>(240);

    readonly slotWidthPx = computed(() => this.maxWidthPerHour() / (60 / this.configuration().intervalMinutes));

    readonly timeSlots = computed(() => {
        const range = this.rangeSelectedDay();
        if (!range) {
            return [];
        }

        return this.buildTimeSlots(range.minStart, range.maxEnd, this.configuration().intervalMinutes);
    });

    readonly talksForSelectedDayByRoom = computed(() => {
        const dayId = this.selectedDay()?.id;
        const map = new Map<string, Talk[]>();
        if (!dayId) {
            return map;
        }

        for (const t of this.talks()) {
            if (t.dayId !== dayId) {
                continue;
            }
            if (!t.roomId) {
                continue;
            }

            const list = map.get(t.roomId) ?? [];
            list.push(t);
            map.set(t.roomId, list);
        }

        for (const list of map.values()) {
            list.sort((a, b) => (a.startSlot ?? 0) - (b.startSlot ?? 0) || a.id.localeCompare(b.id));
        }

        return map;
    });

    readonly unassignedTalks = computed(() => this.talks().filter(t => t.roomId == null || t.dayId == null));

    readonly hoveredTalk = signal<Talk | null>(null);
    readonly hoveredRoomId = signal<string | null>(null);
    readonly hoveredStartSlot = signal<number | null>(null);

    constructor() {
        effect(() => {
            const days = this.days();
            const dayIds = new Set(days.map(d => d.id));
            const roomIds = this.roomsById();

            // sélection du jour (si la liste days change)
            const selectedDay = this.selectedDayId();
            const fallback = days[0]?.id ?? null;

            if (!selectedDay || !dayIds.has(selectedDay)) {
                this.selectedDayId.set(fallback);
            }

            // nettoyage des talks (si days/rooms changent)
            this.talks.update(talks =>
                talks.map(talk => {
                    const dayValid = talk.dayId == null || dayIds.has(talk.dayId);
                    const roomValid = talk.roomId == null || roomIds.has(talk.roomId);

                    if (dayValid && roomValid) {
                        const roomsFromDay = days.find(day => day.id === talk.dayId)?.rooms;
                        if (talk.roomId && roomsFromDay?.map(r => r.roomId).includes(talk.roomId)) {
                            return talk;
                        }
                    }

                    return this.unassignTalk(talk)
                })
            );
        });

        effect(() => {
            // 🔥 nouveau nettoyage : talks en dehors des bounds après recalcul
            const day = this.selectedDay();
            const bounds = this.roomBoundariesById(); // dépend des ranges + interval + roomsFromSelectedDay
            this.cleanupTalksOutsideBounds(day, bounds);
        });
    }

    private unassignTalk(t: Talk): Talk {
        return {...t, roomId: null, dayId: null, startSlot: 0};
    }

    private cleanupTalksOutsideBounds(day: TimelineDay | null, boundsByRoomId: Map<string, RoomBounds>): void {
        if (!day) {
            return;
        }

        this.talks.update(ts =>
            ts.map(t => {
                // ne touche que les talks du jour courant et assignés à une room
                if (t.dayId !== day.id) {
                    return t;
                }
                if (!t.roomId) {
                    return t;
                }

                const b = boundsByRoomId.get(t.roomId);
                if (!b) {
                    // room plus présente dans la config du jour sélectionné
                    return this.unassignTalk(t);
                }

                const periods = this.getTalkNbPeriods(t);
                const start = t.startSlot ?? b.start;
                const end = start + periods;

                const outside = start < b.start || end > b.end;
                if (outside) {
                    return this.unassignTalk(t);
                }

                return t;
            })
        );
    }

    getTalkStartTimeLabel(talk: Talk): string {
        const range = this.rangeSelectedDay();
        if (!range) {
            return '';
        }

        const base = new Date(range.minStart);
        base.setMinutes(base.getMinutes() + (talk.startSlot ?? 0) * this.configuration().intervalMinutes);

        const h = base.getHours().toString().padStart(2, '0');
        const m = base.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    }

    getTalkNbPeriods(talk: Talk | null): number {
        if (!talk) {
            return 1;
        }

        return Math.max(1, Math.ceil(talk.durationTotalMinutes / this.configuration().intervalMinutes));
    }

    onTalkDragMoved(event: CdkDragMove, talk: Talk): void {
        const dragEl = event.source.element.nativeElement;
        const dragRect = dragEl.getBoundingClientRect();
        const {room, rect} = this.findTargetRoom(dragRect);

        if (!room || !rect) {
            this.clearHover();
            return;
        }

        const res = this.computeStartSlotFromRects(dragRect, rect, talk, room.id);

        if (!res.ok) {
            this.clearHover();
            return;
        }

        this.hoveredRoomId.set(room.id);
        this.hoveredStartSlot.set(res.slot);
        this.hoveredTalk.set(talk);
    }

    onTalkDragEnded(event: CdkDragEnd, talk: Talk, day: TimelineDay | null): void {
        if (!day) {
            return;
        }

        const dragEl = event.source.element.nativeElement;
        const dragRect = dragEl.getBoundingClientRect();
        const {room, rect} = this.findTargetRoom(dragRect);

        if (!room || !rect) {
            event.source.reset();

            this.talks.update(ts =>
                ts.map(t => (t.id === talk.id ? this.unassignTalk(t) : t))
            );

            this.clearHover();
            return;
        }

        const res = this.computeStartSlotFromRects(dragRect, rect, talk, room.id);

        event.source.reset();

        if (!res.ok) {
            this.clearHover();
            return;
        }

        this.placeTalkInRoom(talk, day, room, res.slot);
        this.clearHover();
    }

    private computeStartSlotFromRects(dragRect: DOMRect, roomRect: DOMRect, talk: Talk, roomId: string):
        { slot: number; ok: boolean } {

        const midX = dragRect.left + dragRect.width / 2;
        const relativeX = midX - roomRect.left;

        const periods = this.getTalkNbPeriods(talk);
        const rawSlot = Math.round(relativeX / this.slotWidthPx() - periods / 2);

        if (!this.canFitTalkInRoom(talk, roomId)) {
            return {slot: 0, ok: false};
        }

        const boundaries = this.getRoomBounds(roomId);
        const min = boundaries.start;
        const max = boundaries.end - periods;

        if (rawSlot < min || rawSlot > max) {
            return {slot: this.clampStartSlotForRoom(rawSlot, talk, roomId), ok: false};
        }

        return {slot: this.clampStartSlotForRoom(rawSlot, talk, roomId), ok: true};
    }

    private findTargetRoom(dragRect: DOMRect): { room: TimelineRoom | null; rect: DOMRect | null } {
        const tracksArray = this.roomTracks.toArray();
        const midY = dragRect.top + dragRect.height / 2;

        for (const t of tracksArray) {
            const el = t.nativeElement;
            const rect = el.getBoundingClientRect();
            if (midY < rect.top || midY > rect.bottom) {
                continue;
            }

            const roomId = el.dataset['roomId'];
            if (!roomId) {
                continue;
            }

            return {room: this.roomsById().get(roomId) ?? null, rect};
        }

        return {room: null, rect: null};
    }

    private placeTalkInRoom(talk: Talk, day: TimelineDay, room: TimelineRoom, startSlot: number): boolean {
        let success = true;

        this.talks.update(ts => {
            const original = ts;

            const updated = ts.map(t =>
                t.id === talk.id ? {...t, roomId: room.id, dayId: day.id, startSlot} : t
            );

            const result = this.resolveRoomCollisions(updated, room.id, day);

            if (result.overflow) {
                success = false;
                return original;
            }

            return result.talks;
        });

        return success;
    }

    private resolveRoomCollisions(allTalks: Talk[], roomId: string, day: TimelineDay):
        { talks: Talk[]; overflow: boolean } {

        const roomTalks = allTalks
            .filter(t => t.roomId === roomId && t.dayId === day.id)
            .slice()
            .sort((a, b) => (a.startSlot ?? 0) - (b.startSlot ?? 0) || a.id.localeCompare(b.id));

        const updated = new Map<string, Talk>();

        const bounds = this.getRoomBounds(roomId);

        let cursor = bounds.start;
        const maxSlot = bounds.end;
        let overflow = false;

        for (const talk of roomTalks) {
            const periods = this.getTalkNbPeriods(talk);
            const desired = talk.startSlot ?? bounds.start;

            const newStart = Math.max(desired, cursor, bounds.start);
            const newEnd = newStart + periods;

            if (newEnd > maxSlot) {
                overflow = true;
                break;
            }

            cursor = newEnd;
            updated.set(talk.id, {...talk, startSlot: newStart});
        }

        if (overflow) {
            return {talks: allTalks, overflow: true};
        }

        return {
            talks: allTalks.map(t => updated.get(t.id) ?? t),
            overflow: false,
        };
    }

    private buildTimeSlots(startingHour: Date, endingHour: Date, intervalMinutes: IntervalMinutes): string[] {
        const nbSlots = this.countIntervals(startingHour, endingHour, intervalMinutes);

        const out: string[] = [];
        const cursor = new Date(startingHour);

        for (let i = 0; i < nbSlots; i++) {
            const h = cursor.getHours().toString().padStart(2, '0');
            const m = cursor.getMinutes().toString().padStart(2, '0');
            out.push(`${h}:${m}`);
            cursor.setMinutes(cursor.getMinutes() + intervalMinutes);
        }
        return out;
    }

    private countIntervals(startingHour: Date, endingHour: Date, intervalMinutes: IntervalMinutes): number {
        const startMs = startingHour.getTime();
        const endMs = endingHour.getTime();
        if (endMs <= startMs) {
            return 0;
        }

        const intervalMs = intervalMinutes * 60 * 1000;
        const diffMs = endMs - startMs;
        return Math.floor(diffMs / intervalMs);
    }

    private clamp(n: number, min: number, max: number): number {
        return Math.min(Math.max(n, min), max);
    }

    private slotIndexFromGlobalStart(target: Date, base: Date, intervalMin: number): number {
        const msPerSlot = intervalMin * 60000;
        const diffMs = target.getTime() - base.getTime();
        return Math.floor(diffMs / msPerSlot);
    }

    private clearHover(): void {
        this.hoveredRoomId.set(null);
        this.hoveredStartSlot.set(null);
        this.hoveredTalk.set(null);
    }

    isSlotDisabled(roomId: string, slotIndex: number): boolean {
        const b = this.getRoomBounds(roomId);
        return slotIndex < b.start || slotIndex >= b.end;
    }

    private canFitTalkInRoom(talk: Talk, roomId: string): boolean {
        const b = this.getRoomBounds(roomId);
        const periods = this.getTalkNbPeriods(talk);
        return (b.end - b.start) >= periods;
    }

    private clampStartSlotForRoom(slot: number, talk: Talk, roomId: string): number {
        const boundary = this.getRoomBounds(roomId);
        const periods = this.getTalkNbPeriods(talk);

        const minStart = boundary.start;
        const maxStart = boundary.end - periods;

        if (maxStart < minStart) {
            return minStart;
        } // talk trop long pour la room
        return Math.min(Math.max(slot, minStart), maxStart);
    }

    private getRoomBounds(roomId: string): RoomBounds {
        return this.roomBoundariesById().get(roomId) ?? {start: 0, end: this.timeSlots().length};
    }
}

type RoomBounds = { start: number; end: number };