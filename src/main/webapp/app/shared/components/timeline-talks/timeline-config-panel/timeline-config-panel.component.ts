import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output, computed, inject, signal, OnInit} from '@angular/core';
import {FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {DividerModule} from 'primeng/divider';
import {SelectModule} from "primeng/select";
import {DatePickerModule} from "primeng/datepicker";
import {TimelineDay} from "../model/timeline-day";
import {TimelineRoom} from "../model/timeline-room";
import {TimelineData} from "../model/timeline-data";
import {IntervalMinutes} from "../model/interval-minutes";

type IdLabel = { id: string; label: string };

@Component({
    selector: 'app-timeline-config-panel',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        TableModule,
        InputTextModule,
        SelectModule,
        DatePickerModule,
        DividerModule,
        FormsModule,
    ],
    templateUrl: './timeline-config-panel.component.html',
})
export class TimelineConfigPanelComponent {
    private readonly TIME_REF = new Date(2000, 0, 1, 0, 0, 0, 0);

    private fb = inject(NonNullableFormBuilder);

    private _data = signal<TimelineData | null>(null);

    trackByRoomId = (_: number, item: { roomId: string }) => item.roomId;

    @Input({required: true})
    set data(value: TimelineData) {
        // Normalize toutes les heures entrantes sur TIME_REF
        const normalized = structuredClone(value);
        normalized.days.forEach(day => {
            day.rooms.forEach(r => {
                r.startingHour = this.normalizeTime(new Date(r.startingHour));
                r.endingHour = this.normalizeTime(new Date(r.endingHour));
            });
        });

        this._data.set(normalized);

        const sel = this.selectedDayId();
        if (sel && !normalized.days.some(d => d.id === sel)) {
            this.selectedDayId.set(null);
        } else if (!sel) {
            this.selectedDayId.set(normalized.days[0]?.id ?? null);
        }
    }

    get data(): TimelineData {
        const d = this._data();
        if (!d) {
            throw new Error('data required');
        }
        return d;
    }

    @Output() dataChange = new EventEmitter<TimelineData>();

    intervalOptions: IntervalMinutes[] = [5, 15, 30, 60];

    rooms = computed(() => this._data()?.rooms ?? []);
    days = computed(() => this._data()?.days ?? []);

    roomOptions = computed<IdLabel[]>(() =>
        this.rooms()
            .slice()
            .sort((a, b) => a.label.localeCompare(b.label))
            .map(r => ({id: r.id, label: r.label}))
    );

    dayOptions = computed<IdLabel[]>(() =>
        this.days()
            .slice()
            .sort((a, b) => a.label.localeCompare(b.label))
            .map(d => ({id: d.id, label: d.label}))
    );

    // confirmations inline (pas de popup)
    pendingRemoveRoomFromDay = signal<{ dayId: string; roomId: string } | null>(null);

    selectedDayId = signal<string | null>(null);
    selectedDay = computed(() => {
        let out = null;

        const id = this.selectedDayId();
        if (!id) {
            return out;
        }

        const day = this.days().find(d => d.id === id);
        if (day) {
            out = day;
        } else {
            if (this.days().length > 0) {
                this.selectedDayId.set(this.days()[0].id);
                out = this.days()[0];
            }
        }

        return out;
    });

    selectedDayRoomRows = computed(() => {
        const day = this.selectedDay();
        if (!day) {
            return [];
        }

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

    availableRoomsForSelectedDay = computed<IdLabel[]>(() => {
        const day = this.selectedDay();
        if (!day) {
            return this.roomOptions();
        }
        const used = new Set(day.rooms.map(x => x.roomId));
        return this.roomOptions().filter(r => !used.has(r.id));
    });

    addRoomToDayForm = this.fb.group({
        roomId: this.fb.control<string | null>(null, {validators: [Validators.required]}),
        startingHour: this.fb.control<Date>(this.timeAt(8, 0)),
        endingHour: this.fb.control<Date>(this.timeAt(18, 0)),
    });

    // Général
    onIntervalChange(interval: IntervalMinutes) {
        this.commit(next => (next.intervalMinutes = interval));
    }

    // Rooms
    addRoom() {
        this.commit(next => next.rooms.push({id: this.newId(), label: 'Nouvelle salle'}));
    }

    updateRoomLabel(roomId: string, label: string) {
        const v = label.trim();
        if (!v) {
            return;
        }
        this.commit(next => {
            const r = next.rooms.find(x => x.id === roomId);
            if (r) {
                r.label = v;
            }
        });
    }

    // Drafts de saisie (évite de re-render sur chaque frappe via parent)
    private roomLabelDraft = signal<Record<string, string>>({});
    private dayLabelDraft = signal<Record<string, string>>({});

// Optionnel: stabilise encore plus le DOM du p-table
    trackById = (_: number, item: { id: string }) => item.id;

    roomLabel(room: TimelineRoom): string {
        return this.roomLabelDraft()[room.id] ?? room.label;
    }

    setRoomLabelDraft(roomId: string, value: string) {
        this.roomLabelDraft.update(m => ({...m, [roomId]: value}));
    }

    commitRoomLabel(roomId: string) {
        const value = this.roomLabelDraft()[roomId];
        if (value === undefined) {
            return;
        }

        this.updateRoomLabel(roomId, value); // ton commit existant (trim etc.)
        this.roomLabelDraft.update(m => {
            const copy = {...m};
            delete copy[roomId];
            return copy;
        });
    }

    dayLabel(day: TimelineDay): string {
        return this.dayLabelDraft()[day.id] ?? day.label;
    }

    setDayLabelDraft(dayId: string, value: string) {
        this.dayLabelDraft.update(m => ({...m, [dayId]: value}));
    }

    commitDayLabel(dayId: string) {
        const value = this.dayLabelDraft()[dayId];
        if (value === undefined) {
            return;
        }

        this.updateDayLabel(dayId, value);
        this.dayLabelDraft.update(m => {
            const copy = {...m};
            delete copy[dayId];
            return copy;
        });
    }

    askDeleteRoom(roomId: string) {
        this.commit(next => {
            next.rooms = next.rooms.filter(r => r.id !== roomId);
            next.days = next.days.map(d => ({...d, rooms: d.rooms.filter(rd => rd.roomId !== roomId)}));
        });
    }

    // Days
    addDay() {
        this.commit(next => next.days.push({id: this.newId(), label: 'Nouveau jour', rooms: []}));
    }

    updateDayLabel(dayId: string, label: string) {
        const v = label.trim();
        if (!v) {
            return;
        }
        this.commit(next => {
            const d = next.days.find(x => x.id === dayId);
            if (d) {
                d.label = v;
            }
        });
    }

    askDeleteDay(dayId: string) {
        this.commit(next => {
            next.days = next.days.filter(d => d.id !== dayId);
        });
        if (this.selectedDayId() === dayId) {
            this.selectedDayId.set(null);
        }
    }

    // Assignations
    onSelectDay(dayId: string | null) {
        this.selectedDayId.set(dayId);
        this.addRoomToDayForm.reset({
            roomId: null,
            startingHour: this.timeAt(8, 0),
            endingHour: this.timeAt(18, 0),
        });
    }

    addRoomToSelectedDay() {
        const day = this.selectedDay();
        if (!day) {
            return;
        }

        if (this.addRoomToDayForm.invalid) {
            this.addRoomToDayForm.markAllAsTouched();
            return;
        }

        const roomId = this.addRoomToDayForm.controls.roomId.value!;
        const start = this.normalizeTime(this.addRoomToDayForm.controls.startingHour.value);
        const end = this.normalizeTime(this.addRoomToDayForm.controls.endingHour.value);
        if (end.getTime() <= start.getTime()) {
            return;
        }

        this.commit(next => {
            const d = next.days.find(x => x.id === day.id);
            if (!d) {
                return;
            }
            if (d.rooms.some(r => r.roomId === roomId)) {
                return;
            }
            d.rooms.push({roomId, startingHour: start, endingHour: end});
        });

        this.addRoomToDayForm.reset({
            roomId: null,
            startingHour: this.timeAt(8, 0),
            endingHour: this.timeAt(18, 0),
        });
    }

    updateSelectedDayRoomTime(roomId: string, startingHour: Date, endingHour: Date) {
        const day = this.selectedDay();
        if (!day) {
            return;
        }

        const start = this.normalizeTime(startingHour);
        const end = this.normalizeTime(endingHour);
        if (end.getTime() <= start.getTime()) {
            return;
        }

        this.commit(next => {
            const d = next.days.find(x => x.id === day.id);
            if (!d) {
                return;
            }
            const rd = d.rooms.find(x => x.roomId === roomId);
            if (!rd) {
                return;
            }
            rd.startingHour = start;
            rd.endingHour = end;
        });
    }

    askRemoveRoomFromSelectedDay(roomId: string) {
        const day = this.selectedDay();
        if (!day) {
            return;
        }
        this.commit(next => {
            const d = next.days.find(x => x.id === day.id);
            if (!d) {
                return;
            }
            d.rooms = d.rooms.filter(x => x.roomId !== roomId);
        });
    }

    // infra
    private commit(mutator: (next: TimelineData) => void) {
        const current = this._data();
        if (!current) {
            return;
        }
        const next = structuredClone(current);
        mutator(next);
        this._data.set(next);
        this.dataChange.emit(next);
    }

    private newId(): string {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return 'id_' + Math.random().toString(16).slice(2) + Date.now().toString(16);
    }

    private timeAt(h: number, m: number): Date {
        const d = new Date(this.TIME_REF.getTime()); // clone propre
        d.setHours(h, m, 0, 0);
        return d;
    }

    private normalizeTime(d: Date): Date {
        // Reprend uniquement heures/minutes et force la date TIME_REF
        const x = new Date(this.TIME_REF.getTime());
        x.setHours(d.getHours(), d.getMinutes(), 0, 0);
        return x;
    }
}