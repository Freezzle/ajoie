import {CommonModule} from '@angular/common';
import {Component, computed, EventEmitter, inject, Input, Output, signal} from '@angular/core';
import {FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {TableModule} from 'primeng/table';
import {SelectModule} from 'primeng/select';
import {DatePickerModule} from 'primeng/datepicker';
import {ButtonModule} from 'primeng/button';

import {TimelineData} from '../model/timeline-data';
import {InputText} from "primeng/inputtext";
import {Divider} from "primeng/divider";
import {TimelineDay} from "../model/timeline-day";

type IdLabel = { id: string; label: string };

@Component({
    selector: 'tp-config-day',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        SelectModule,
        DatePickerModule,
        ButtonModule,
        InputText,
        Divider,
    ],
    templateUrl: './tp-config-day.component.html',
})
export class TpConfigDayComponent {
    private readonly TIME_REF = new Date(2000, 0, 1, 0, 0, 0, 0);
    private fb = inject(NonNullableFormBuilder);

    _draft = signal<TimelineData | null>(null);
    private _selectedDayId = signal<string | null>(null);
    private _createIfMissing = signal(false);
    @Input()
    set createIfMissing(v: boolean) {
        this._createIfMissing.set(!!v);
        this.ensureSelectedDayExistsInDraft();
    }

    get createIfMissing(): boolean {
        return this._createIfMissing();
    }

    @Input() newDayDefaultLabel = 'Nouveau jour';

    @Input({required: true})
    set selectedDayId(value: string | null) {
        this._selectedDayId.set(value);
        this.ensureSelectedDayExistsInDraft();
    }

    get selectedDayId(): string {
        const v = this._selectedDayId();
        if (!v) throw new Error('selectedDayId required');
        return v;
    }

    @Input({required: true})
    set data(value: TimelineData) {
        const normalized = structuredClone(value);
        normalized.days.forEach(day => {
            day.rooms.forEach(r => {
                r.startingHour = this.normalizeTime(new Date(r.startingHour));
                r.endingHour = this.normalizeTime(new Date(r.endingHour));
            });
        });
        this._draft.set(normalized);
        this.ensureSelectedDayExistsInDraft();
    }

    @Output() confirmDraft = new EventEmitter<TimelineData>();
    @Output() cancelDraft = new EventEmitter<void>();

    rooms = computed(() => this._draft()?.rooms ?? []);
    day = computed(() => {
        const d = this._draft();
        const id = this._selectedDayId();
        if (!d || !id) return null;
        return d.days.find(x => x.id === id) ?? null;
    });

    roomOptions = computed<IdLabel[]>(() =>
        this.rooms()
            .slice()
            .sort((a, b) => a.label.localeCompare(b.label))
            .map(r => ({id: r.id, label: r.label}))
    );

    trackByRoomId = (_: number, item: { roomId: string }) => item.roomId;

    selectedDayRoomRows = computed(() => {
        const day = this.day();
        if (!day) return [];
        const roomsById = new Map(this.rooms().map(r => [r.id, r]));
        return day.rooms
            .map(rd => ({
                roomId: rd.roomId,
                roomLabel: roomsById.get(rd.roomId)?.label ?? '(salle supprimée)',
                startingHour: rd.startingHour,
                endingHour: rd.endingHour,
            }))
            .sort((a, b) => a.roomLabel.localeCompare(b.roomLabel));
    });

    availableRoomsForDay = computed<IdLabel[]>(() => {
        const day = this.day();
        if (!day) return this.roomOptions();
        const used = new Set(day.rooms.map(x => x.roomId));
        return this.roomOptions().filter(r => !used.has(r.id));
    });

    addRoomToDayForm = this.fb.group({
        roomId: this.fb.control<string | null>(null, {validators: [Validators.required]}),
        startingHour: this.fb.control<Date>(this.timeAt(8, 0)),
        endingHour: this.fb.control<Date>(this.timeAt(18, 0)),
    });

    private dayLabelDraft = signal<Record<string, string>>({});

    dayLabel(day: TimelineDay): string {
        return this.dayLabelDraft()[day.id] ?? day.label;
    }

    setDayLabelDraft(dayId: string, value: string) {
        this.dayLabelDraft.update(m => ({...m, [dayId]: value}));
    }

    addRoomToDay() {
        const day = this.day();
        if (!day) return;

        if (this.addRoomToDayForm.invalid) {
            this.addRoomToDayForm.markAllAsTouched();
            return;
        }

        const roomId = this.addRoomToDayForm.controls.roomId.value!;
        const start = this.normalizeTime(this.addRoomToDayForm.controls.startingHour.value);
        const end = this.normalizeTime(this.addRoomToDayForm.controls.endingHour.value);
        if (end.getTime() <= start.getTime()) return;

        this.commit(next => {
            const d = next.days.find(x => x.id === day.id);
            if (!d) return;
            if (d.rooms.some(r => r.roomId === roomId)) return;
            d.rooms.push({roomId, startingHour: start, endingHour: end});
        });

        this.addRoomToDayForm.reset({
            roomId: null,
            startingHour: this.timeAt(8, 0),
            endingHour: this.timeAt(18, 0),
        });
    }

    commitDayLabel(dayId: string) {
        const value = this.dayLabelDraft()[dayId];
        if (value === undefined) return;

        const v = value.trim();
        if (!v) return;

        this.commit(next => {
            const d = next.days.find(x => x.id === dayId);
            if (d) d.label = v;
        });

        this.dayLabelDraft.update(m => {
            const copy = {...m};
            delete copy[dayId];
            return copy;
        });
    }

    updateRoomTime(roomId: string, startingHour: Date, endingHour: Date) {
        const day = this.day();
        if (!day) return;

        const start = this.normalizeTime(startingHour);
        const end = this.normalizeTime(endingHour);
        if (end.getTime() <= start.getTime()) return;

        this.commit(next => {
            const d = next.days.find(x => x.id === day.id);
            if (!d) return;
            const rd = d.rooms.find(x => x.roomId === roomId);
            if (!rd) return;
            rd.startingHour = start;
            rd.endingHour = end;
        });
    }

    removeRoomFromDay(roomId: string) {
        const day = this.day();
        if (!day) return;

        this.commit(next => {
            const d = next.days.find(x => x.id === day.id);
            if (!d) return;
            d.rooms = d.rooms.filter(x => x.roomId !== roomId);
        });
    }

    confirm() {
        const d = this._draft();
        const day = this.day();
        if (!d || !day) return;
        this.confirmDraft.emit(structuredClone(d));
    }

    cancel() {
        this.cancelDraft.emit();
    }

    private commit(mutator: (next: TimelineData) => void) {
        const current = this._draft();
        if (!current) return;
        const next = structuredClone(current);
        mutator(next);
        this._draft.set(next);
    }

    private ensureSelectedDayExistsInDraft() {
        const draft = this._draft();
        const id = this._selectedDayId();
        if (!draft || !id) return;

        const exists = draft.days.some(d => d.id === id);
        if (exists) return;

        if (!this._createIfMissing()) return;

        // création UNIQUEMENT dans le draft
        this.commit(next => {
            next.days.push({
                id,
                label: this.newDayDefaultLabel ?? 'Nouveau jour',
                rooms: [],
            });
        });
    }

    private timeAt(h: number, m: number): Date {
        const d = new Date(this.TIME_REF.getTime());
        d.setHours(h, m, 0, 0);
        return d;
    }

    private normalizeTime(d: Date): Date {
        const x = new Date(this.TIME_REF.getTime());
        x.setHours(d.getHours(), d.getMinutes(), 0, 0);
        return x;
    }
}