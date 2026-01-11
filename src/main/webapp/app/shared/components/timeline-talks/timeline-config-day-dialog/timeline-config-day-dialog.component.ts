import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';

import { TimelineData } from '../model/timeline-data';
import { TimelineDay } from '../model/timeline-day';
import { IntervalMinutes } from '../model/interval-minutes';

@Component({
  selector: 'app-timeline-config-day-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SelectModule,
    InputTextModule,
    DatePickerModule,
    DividerModule,
  ],
  templateUrl: './timeline-config-day-dialog.component.html',
})
export class TimelineConfigDayDialogComponent {
  private readonly TIME_REF = new Date(2000, 0, 1, 0, 0, 0, 0);
  private fb = inject(NonNullableFormBuilder);

  _draft = signal<TimelineData | null>(null);

  private _createIfMissing = signal(false);
  @Input()
  set createIfMissing(v: boolean) {
    this._createIfMissing.set(!!v);
    this.ensureSelectedDayExistsInDraft();
    this.loadDayPeriodFromSelectedDay();
  }
  get createIfMissing(): boolean {
    return this._createIfMissing();
  }

  @Input() newDayDefaultLabel = 'Nouveau jour';

  // jour imposé (pas de select)
  private _selectedDayId = signal<string | null>(null);

  @Input({ required: true })
  set selectedDayId(value: string) {
    this._selectedDayId.set(value);
    this.ensureSelectedDayExistsInDraft();
    this.loadDayPeriodFromSelectedDay();
  }
  get selectedDayId(): string {
    const v = this._selectedDayId();
    if (!v) throw new Error('selectedDayId required');
    return v;
  }

  @Input({ required: true })
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
    this.loadDayPeriodFromSelectedDay();
  }

  @Output() confirmDraft = new EventEmitter<TimelineData>();
  @Output() cancelDraft = new EventEmitter<void>();

  intervalOptions: IntervalMinutes[] = [5, 15, 30, 60];

  selectedDay = computed<TimelineDay | null>(() => {
    const d = this._draft();
    const id = this._selectedDayId();
    if (!d || !id) return null;
    return d.days.find(x => x.id === id) ?? null;
  });

  // Label draft (sans commit vers parent)
  private dayLabelDraft = signal<Record<string, string>>({});

  dayLabel(day: TimelineDay): string {
    return this.dayLabelDraft()[day.id] ?? day.label;
  }

  setDayLabelDraft(dayId: string, value: string) {
    this.dayLabelDraft.update(m => ({ ...m, [dayId]: value }));
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
      const copy = { ...m };
      delete copy[dayId];
      return copy;
    });
  }

  onIntervalChange(interval: IntervalMinutes) {
    this.commit(next => (next.intervalMinutes = interval));
  }

  // Période du jour : applique à toutes les salles affectées à ce jour
  dayPeriodForm = this.fb.group({
    startingHour: this.fb.control<Date>(this.timeAt(8, 0), { validators: [Validators.required] }),
    endingHour: this.fb.control<Date>(this.timeAt(18, 0), { validators: [Validators.required] }),
  });

  loadDayPeriodFromSelectedDay() {
    const day = this.selectedDay();
    if (!day) return;

    if (day.rooms.length === 0) {
      this.dayPeriodForm.reset({
        startingHour: this.timeAt(8, 0),
        endingHour: this.timeAt(18, 0),
      });
      return;
    }

    const first = day.rooms[0];
    this.dayPeriodForm.reset({
      startingHour: this.normalizeTime(new Date(first.startingHour)),
      endingHour: this.normalizeTime(new Date(first.endingHour)),
    });
  }

  // appelé par (confirm) du dialog-box via @ViewChild côté parent
  confirm() {
    const d = this._draft();
    const day = this.selectedDay();
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
}