import {Component, computed, inject, Input, OnDestroy, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {SelectModule} from 'primeng/select';
import {InputTextModule} from 'primeng/inputtext';
import {TextareaModule} from 'primeng/textarea';
import {DatePickerModule} from 'primeng/datepicker';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';

import {Day, IntervalMinutes} from '../volunteer-planning-model';
import {DayConfigSlice} from '../volunteer-planning-slices';
import {DialogDraftService} from '../../../../shared/services/dialog-draft.service';

@Component({
               selector: 'selected-day-editor',
               standalone: true,
               imports: [FormsModule, SelectModule, InputTextModule, TextareaModule, DatePickerModule, TranslatePipe],
               templateUrl: './selected-day-editor.component.html'
           })
export class SelectedDayEditorComponent implements OnInit, OnDestroy {
    private readonly TIME_REF = new Date(2000, 0, 1, 0, 0, 0, 0);
    private readonly draftService = inject(DialogDraftService);
    private readonly translate = inject(TranslateService);

    readonly intervalValues: IntervalMinutes[] = [5, 15, 30, 60];

    intervalOptions = computed<{ label: string; value: IntervalMinutes }[]>(() =>
        this.intervalValues.map(v => ({
            label: this.translate.instant(`planningVolunteers.interval.${v}`),
            value: v
        }))
    );

    _draft = signal<DayConfigSlice | null>(null);
    day = computed<Day | null>(() => this._draft()?.day ?? null);
    interval = computed<IntervalMinutes>(() => this._draft()?.day?.intervalMinutes ?? 60);

    private dayLabelDraft = signal<string | null>(null);
    private dayDescriptionDraft = signal<string | null>(null);
    // Référence Date stable pour le p-datepicker (évite de recréer un objet à chaque détection).
    readonly dateModel = signal<Date | null>(null);

    @Input({required: true})
    set data(value: DayConfigSlice) {
        const normalized = structuredClone(value);

        // IMPORTANT: PrimeNG DatePicker aime bien avoir de vrais Date,
        // mais pour des heures only on force une date de référence.
        normalized.day.startTime = this.normalizeTime(new Date(normalized.day.startTime));
        normalized.day.endTime = this.normalizeTime(new Date(normalized.day.endTime));

        // Optionnel: si valeurs incohérentes, on remet un défaut "safe"
        if (normalized.day.endTime.getTime() <= normalized.day.startTime.getTime()) {
            normalized.day.startTime = this.timeAt(8, 0);
            normalized.day.endTime = this.timeAt(18, 0);
        }

        this._draft.set(normalized);
        this.dayLabelDraft.set(null);
        this.dayDescriptionDraft.set(null);
        this.dateModel.set(this.parseIsoDate(normalized.day.date ?? null));
    }

    ngOnInit() {
        this.draftService.registerDraft(() => {
            const d = this._draft();
            return d ? structuredClone(d) : null;
        });
    }

    ngOnDestroy() {
        this.draftService.unregisterDraft();
    }

    dayLabel(): string {
        const d = this.day();
        if (!d) {
            return '';
        }
        return this.dayLabelDraft() ?? d.label;
    }

    setDayLabelDraft(v: string) {
        this.dayLabelDraft.set(v);
    }

    commitDayLabel() {
        const raw = this.dayLabelDraft();
        if (raw == null) {
            return;
        }
        const v = raw.trim();
        if (!v) {
            return;
        }

        this.commit(next => {
            next.day.label = v;
        });

        this.dayLabelDraft.set(null);
    }

    dayDescription(): string {
        return this.dayDescriptionDraft() ?? this.day()?.description ?? '';
    }

    setDayDescriptionDraft(v: string) {
        this.dayDescriptionDraft.set(v);
    }

    commitDayDescription() {
        const raw = this.dayDescriptionDraft();
        if (raw == null) {
            return;
        }
        const v = raw.trim();
        this.commit(next => {
            next.day.description = v || undefined;
        });
        this.dayDescriptionDraft.set(null);
    }

    dateValue(): Date | null {
        return this.dateModel();
    }

    updateDate(value: Date | null) {
        this.dateModel.set(value ?? null);
        this.commit(next => {
            next.day.date = value ? this.toIsoDate(value) : undefined;
        });
    }

    private parseIsoDate(date: string | null): Date | null {
        if (!date) {
            return null;
        }
        const parts = date.split('-').map(Number);
        return parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : null;
    }

    private toIsoDate(d: Date): string {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    updateInterval(value: IntervalMinutes) {
        this.commit(next => {
            next.day.intervalMinutes = value;
        });
    }

    updateStartTime(start: Date) {
        const d = this.day();
        if (!d) {
            return;
        }

        const s = this.normalizeTime(start);
        const e = this.normalizeTime(d.endTime);

        if (e.getTime() <= s.getTime()) {
            return;
        }

        this.commit(next => {
            next.day.startTime = s;
            // on renormalise aussi endTime par sécurité (au cas où il aurait une autre date)
            next.day.endTime = this.normalizeTime(next.day.endTime);
        });
    }

    updateEndTime(end: Date) {
        const d = this.day();
        if (!d) {
            return;
        }

        const s = this.normalizeTime(d.startTime);
        const e = this.normalizeTime(end);

        if (e.getTime() <= s.getTime()) {
            return;
        }

        this.commit(next => {
            next.day.endTime = e;
            next.day.startTime = this.normalizeTime(next.day.startTime);
        });
    }

    private commit(mutator: (next: DayConfigSlice) => void) {
        const current = this._draft();
        if (!current) {
            return;
        }
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
}

