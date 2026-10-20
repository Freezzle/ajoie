import {
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    HostListener,
    inject,
    input,
    output,
    signal,
    viewChildren
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {PlanningTalkBlockComponent} from './planning-talk-block.component';
import {hhmm, isPlaced, Talk, talkKey, TimelineData, TimelineDay, TimelineRoom} from '../talks-planning-model';
import {
    checkPlacement,
    ConflictReason,
    dayBounds,
    floorStart,
    occupiedStart,
    RoomBounds,
    snapStart
} from '../talks-planning-utils';

export interface GridRoom {
    room: TimelineRoom;
    bounds: RoomBounds | null;
}

export interface SlotEvent {
    dayId: string;
    roomId: string;
    startMinute: number;
}

export interface PlaceEvent extends SlotEvent {
    key: string;
}

interface LaneBlock {
    key: string;
    talk: Talk;
    top: number;
    height: number;
}

interface Preview {
    roomId: string;
    top: number;
    height: number;
    prepHeight: number;
    cleanHeight: number;
    ok: boolean;
    label: string;
    hint: string;
}

/** Grille d'un jour. Utilisée en desktop avec toutes les salles, en mobile avec une seule. */
@Component({
               selector: 'planning-grid',
               standalone: true,
               imports: [PlanningTalkBlockComponent],
               templateUrl: './planning-grid.component.html',
               styleUrl: './planning-grid.component.scss',
               changeDetection: ChangeDetectionStrategy.OnPush
           })
export class PlanningGridComponent {
    readonly configuration = input.required<TimelineData>();
    readonly day = input.required<TimelineDay>();
    readonly rooms = input.required<GridRoom[]>();
    readonly talks = input.required<Talk[]>();
    readonly pxPerMinute = input<number>(1.7);
    readonly isEditing = input<boolean>(false);
    readonly talkInHand = input<string | null>(null);
    readonly selectedSlot = input<SlotEvent | null>(null);
    readonly focusTherapist = input<string | null>(null);
    /** Titre d'infobulle du conflit, déjà traduit, par clé d'intervention. */
    readonly conflictTitles = input<Map<string, string>>(new Map());

    readonly slotClick = output<SlotEvent>();
    readonly talkClick = output<string>();
    readonly placeRequest = output<PlaceEvent>();
    readonly unplaceRequest = output<string>();

    private readonly translate = inject(TranslateService);
    private readonly laneRefs = viewChildren<ElementRef<HTMLElement>>('lane');

    readonly preview = signal<Preview | null>(null);
    private readonly dragKey = signal<string | null>(null);
    private dragOffsetPx = 0;
    private swallowNextClick = false;

    readonly bounds = computed<RoomBounds>(() => dayBounds(this.day()) ?? {start: 10 * 60, end: 18 * 60});

    readonly heightPx = computed(() => (this.bounds().end - this.bounds().start) * this.pxPerMinute());

    readonly columns = computed(() => `var(--tp-axis-w) repeat(${this.rooms().length}, minmax(150px, 1fr))`);

    readonly stepHeightCss = computed(() => `${this.configuration().intervalMinutes * this.pxPerMinute()}px`);

    readonly axisLines = computed(() => {
        const {start, end} = this.bounds();
        const step = this.configuration().intervalMinutes;
        const ppm = this.pxPerMinute();
        const lines: { minute: number; top: number; label: string; full: boolean }[] = [];
        const first = Math.ceil(start / step) * step;
        for (let m = first; m <= end; m += step) {
            lines.push({minute: m, top: (m - start) * ppm, label: hhmm(m), full: m % 60 === 0});
        }
        return lines;
    });

    readonly blocksByRoom = computed<Map<string, LaneBlock[]>>(() => {
        const dayId = this.day().id;
        const {start} = this.bounds();
        const ppm = this.pxPerMinute();
        const map = new Map<string, LaneBlock[]>();
        for (const talk of this.talks()) {
            if (!isPlaced(talk) || talk.dayId !== dayId) {
                continue;
            }
            const list = map.get(talk.roomId!) ?? [];
            list.push({
                          key: talkKey(talk),
                          talk,
                          top: (occupiedStart(talk, talk.startMinute!) - start) * ppm,
                          height: talk.durationTotalMinutes * ppm
                      });
            map.set(talk.roomId!, list);
        }
        return map;
    });

    /** Zones fermées, en pixels, pour une salle de ce jour. */
    closedAreas(entry: GridRoom): { top: number; height: number }[] {
        const {start, end} = this.bounds();
        const ppm = this.pxPerMinute();
        if (!entry.bounds) {
            return [{top: 0, height: (end - start) * ppm}];
        }
        const areas: { top: number; height: number }[] = [];
        if (entry.bounds.start > start) {
            areas.push({top: 0, height: (entry.bounds.start - start) * ppm});
        }
        if (entry.bounds.end < end) {
            areas.push({top: (entry.bounds.end - start) * ppm, height: (end - entry.bounds.end) * ppm});
        }
        return areas;
    }

    blocksOf(roomId: string): LaneBlock[] {
        return this.blocksByRoom().get(roomId) ?? [];
    }

    roomHours(entry: GridRoom): string {
        return entry.bounds
               ? `${hhmm(entry.bounds.start)}–${hhmm(entry.bounds.end)}`
               : this.translateText('planningTalks.block.closed');
    }

    conflictTitleOf(key: string): string {
        return this.conflictTitles().get(key) ?? '';
    }

    isDimmed(talk: Talk): boolean {
        const focus = this.focusTherapist();
        return focus !== null && talk.participation.therapistName !== focus;
    }

    isHighlighted(talk: Talk): boolean {
        const focus = this.focusTherapist();
        return focus !== null && talk.participation.therapistName === focus;
    }

    isSelectedSlot(roomId: string): boolean {
        const slot = this.selectedSlot();
        return slot !== null && slot.roomId === roomId && slot.dayId === this.day().id;
    }

    selectedSlotTop(): number {
        const slot = this.selectedSlot();
        return slot ? (slot.startMinute - this.bounds().start) * this.pxPerMinute() : 0;
    }

    selectedSlotHeight(): number {
        return this.configuration().placementIntervalMinutes * this.pxPerMinute();
    }

    // ---------- interactions ----------

    onBlockPointerDown(event: PointerEvent, block: LaneBlock): void {
        if (!this.isEditing() || event.button !== 0) {
            return;
        }
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        this.dragOffsetPx = event.clientY - rect.top;
        this.dragKey.set(block.key);
        event.preventDefault();
    }

    onLaneMove(event: PointerEvent, entry: GridRoom): void {
        if (!this.isEditing() || this.dragKey()) {
            return;
        }
        const key = this.talkInHand();
        const talk = key ? this.findTalk(key) : null;
        if (!talk) {
            this.preview.set(null);
            return;
        }
        const start = this.floorMinuteAt(event, entry);
        this.showPreview(talk, entry, start);
    }

    onLaneLeave(): void {
        if (!this.dragKey()) {
            this.preview.set(null);
        }
    }

    onLaneClick(event: MouseEvent, entry: GridRoom): void {
        if (!this.isEditing()) {
            return;
        }
        if (this.swallowNextClick) {
            this.swallowNextClick = false;
            return;
        }
        const start = this.floorMinuteAt(event, entry);
        const key = this.talkInHand();
        if (key) {
            this.placeRequest.emit({key, dayId: this.day().id, roomId: entry.room.id, startMinute: start});
            this.preview.set(null);
            return;
        }
        this.slotClick.emit({dayId: this.day().id, roomId: entry.room.id, startMinute: start});
    }

    /** Relâchement d'un glisser venu du bac : l'intervention en main est posée ici. */
    onLanePointerUp(event: PointerEvent, entry: GridRoom): void {
        const key = this.talkInHand();
        if (!this.isEditing() || !key || this.dragKey()) {
            return;
        }
        this.swallowNextClick = true;
        this.preview.set(null);
        this.placeRequest.emit({
                                   key,
                                   dayId: this.day().id,
                                   roomId: entry.room.id,
                                   startMinute: this.floorMinuteAt(event, entry)
                               });
    }

    onBlockClick(block: LaneBlock): void {
        if (this.isEditing() && this.talkInHand()) {
            return;
        }
        this.talkClick.emit(block.key);
    }

    @HostListener('document:pointermove', ['$event'])
    onDocumentPointerMove(event: PointerEvent): void {
        const key = this.dragKey();
        if (!key) {
            return;
        }
        const talk = this.findTalk(key);
        const entry = this.laneAt(event.clientX, event.clientY);
        if (!talk || !entry) {
            this.preview.set(null);
            return;
        }
        this.showPreview(talk, entry.room, this.dragStartMinute(event, talk, entry.element));
    }

    @HostListener('document:pointerup', ['$event'])
    onDocumentPointerUp(event: PointerEvent): void {
        const key = this.dragKey();
        if (!key) {
            return;
        }
        this.dragKey.set(null);
        this.preview.set(null);

        const talk = this.findTalk(key);
        const entry = this.laneAt(event.clientX, event.clientY);
        if (!talk) {
            return;
        }
        if (!entry) {
            // Dépôt hors grille : l'intervention revient dans « À planifier ».
            this.unplaceRequest.emit(key);
            return;
        }
        this.placeRequest.emit({
                                   key,
                                   dayId: this.day().id,
                                   roomId: entry.room.room.id,
                                   startMinute: this.dragStartMinute(event, talk, entry.element)
                               });
    }

    // ---------- calculs de position ----------

    private findTalk(key: string): Talk | null {
        return this.talks().find(talk => talkKey(talk) === key) ?? null;
    }

    private laneAt(x: number, y: number): { room: GridRoom; element: HTMLElement } | null {
        const rooms = this.rooms();
        const lanes = this.laneRefs();
        for (let i = 0; i < lanes.length; i++) {
            const element = lanes[i].nativeElement;
            const rect = element.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return {room: rooms[i], element};
            }
        }
        return null;
    }

    /** Minute brute sous le pointeur, arrondie au pas inférieur (clic et survol). */
    private floorMinuteAt(event: MouseEvent, entry: GridRoom): number {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const raw = this.bounds().start + (event.clientY - rect.top) / this.pxPerMinute();
        return floorStart(raw, entry.bounds, this.configuration().placementIntervalMinutes);
    }

    /** Glisser-déposer : le haut du bloc est le début de la préparation. */
    private dragStartMinute(event: PointerEvent, talk: Talk, lane: HTMLElement): number {
        const rect = lane.getBoundingClientRect();
        const topMinute = this.bounds().start + (event.clientY - this.dragOffsetPx - rect.top) / this.pxPerMinute();
        const entry = this.rooms().find(r => r.room.id === lane.dataset['room']);
        return snapStart(topMinute + talk.preparationMinutes,
                         entry?.bounds ?? null,
                         this.configuration().placementIntervalMinutes);
    }

    private showPreview(talk: Talk, entry: GridRoom, start: number): void {
        const config = this.configuration();
        const ppm = this.pxPerMinute();
        const check = checkPlacement(talk, this.talks(), config, this.day().id, entry.room.id, start);
        this.preview.set({
                             roomId: entry.room.id,
                             top: (occupiedStart(talk, start) - this.bounds().start) * ppm,
                             height: talk.durationTotalMinutes * ppm,
                             prepHeight: talk.preparationMinutes * ppm,
                             cleanHeight: talk.cleanupMinutes * ppm,
                             ok: check.ok,
                             label: `${hhmm(start)} – ${hhmm(start + talk.durationTalkMinutes)}`,
                             hint: check.ok
                                   ? this.translateText('planningTalks.inHand.free')
                                   : this.translateReason(check.reasons[0])
                         });
    }

    private translateReason(reason: ConflictReason): string {
        return this.translateText(reason.key, reason.params);
    }

    private translateText(key: string, params?: Record<string, string | number>): string {
        return String(this.translate.instant(key, params));
    }
}
