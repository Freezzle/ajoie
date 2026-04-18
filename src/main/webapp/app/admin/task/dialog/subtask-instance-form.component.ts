import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import SharedModule from 'app/shared/shared.module';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {DateBoxComponent} from '../../../shared/components/date-box/date-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {SelectBoxComponent} from '../../../shared/components/select-box/select-box.component';
import {DialogDraftService} from '../../../shared/services/dialog-draft.service';
import {DateInputType, ISubtaskInstance} from '../model/task-instance.interface';
import {SelectButton} from 'primeng/selectbutton';
import {Popover} from 'primeng/popover';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'app-subtask-instance-form',
    templateUrl: './subtask-instance-form.component.html',
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        TextBoxComponent,
        TextareaBoxComponent,
        DateBoxComponent,
        NumberBoxComponent,
        CheckboxBoxComponent,
        SelectBoxComponent,
        SelectButton,
        Popover
    ]
})
export class SubtaskInstanceFormComponent implements OnInit, OnDestroy {
    /** Données existantes en mode édition, null en mode création. */
    @Input() subtask: ISubtaskInstance | null = null;
    /** Date de début du salon (objet Date), utilisée pour prévisualiser la date estimée en mode OFFSET. */
    @Input() salonStartingDate: Date | null = null;

    form!: FormGroup;
    private readonly subscriptions = new Subscription();

    /** Options Avant / Après pour le select de direction d'offset. */
    readonly offsetDirectionOptions: string[] = ['BEFORE', 'AFTER'];

    readonly formatterDirection = (v: string | null) => v === 'BEFORE' ? 'task.dialog.offsetBefore' : v === 'AFTER' ? 'task.dialog.offsetAfter' : '';

    /** Date estimée calculée à partir de salonStartingDate + offset (null si données insuffisantes). */
    get estimatedDueDate(): string | null {
        const offset = this.form?.get('dueDateOffset')?.value;
        if (offset === null || offset === undefined || offset === '' || !this.salonStartingDate) return null;
        const d = new Date(this.salonStartingDate);
        d.setDate(d.getDate() + Number(offset));
        return d.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    /** Date estimée du snooze = date d'échéance calculée + snoozeOffset (null si données insuffisantes). */
    get estimatedSnoozeDate(): string | null {
        const snoozeOffset = this.form?.get('snoozeOffset')?.value;
        if (snoozeOffset === null || snoozeOffset === undefined || snoozeOffset === '') return null;
        let baseDate: Date | null = null;
        if (this.dueDateType === 'OFFSET') {
            const dueOffset = this.form?.get('dueDateOffset')?.value;
            if (dueOffset !== null && dueOffset !== undefined && dueOffset !== '' && this.salonStartingDate) {
                baseDate = new Date(this.salonStartingDate);
                baseDate.setDate(baseDate.getDate() + Number(dueOffset));
            }
        } else if (this.dueDateType === 'FIXED') {
            const fixed = this.form?.get('dueDateFixed')?.value;
            if (fixed) baseDate = new Date(fixed);
        }
        if (!baseDate) return null;
        baseDate.setDate(baseDate.getDate() + Number(snoozeOffset));
        return baseDate.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    /** Date de début du salon formatée en jj.mm.yyyy (null si absente). */
    get salonStartingDateFormatted(): string | null {
        if (!this.salonStartingDate) return null;
        return this.salonStartingDate.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    get dueDateTypeOptions() {
        return [
            { label: this.translate.instant('task.dialog.dueDateJN'), value: 'OFFSET' },
            { label: this.translate.instant('task.dialog.dueDateFixed'), value: 'FIXED' }
        ];
    }

    get snoozeTypeOptions() {
        return [
            { label: this.translate.instant('task.dialog.snoozeNone'), value: null },
            { label: this.translate.instant('task.dialog.dueDateJN'), value: 'OFFSET' },
            { label: this.translate.instant('task.dialog.dueDateFixed'), value: 'FIXED' }
        ];
    }

    private readonly fb = inject(FormBuilder);
    private readonly draftService = inject(DialogDraftService);
    private readonly translate = inject(TranslateService);

    get dueDateType(): DateInputType {
        return this.form?.get('dueDateType')?.value ?? 'FIXED';
    }

    get snoozeUntilType(): DateInputType | null {
        return this.form?.get('snoozeUntilType')?.value ?? null;
    }

    ngOnInit(): void {
        const s = this.subtask;
        this.form = this.fb.group({
            title:          [s?.title ?? '', [Validators.required, Validators.maxLength(500)]],
            description:    [s?.description ?? ''],
            responsible:    [s?.responsible ?? ''],
            supplierInfo:   [s?.supplierInfo ?? ''],
            dueDateType:    [s?.dueDateType ?? 'OFFSET'],
            dueDateFixed:   [s?.dueDateType === 'FIXED' && s?.dueDate ? new Date(s.dueDate + 'T00:00:00') : null],
            dueDateOffset:  [s?.dueDateType === 'OFFSET' ? s.dueDateOffset : null, [Validators.min(-999), Validators.max(999)]],
            dueDateOffsetAbs: [s?.dueDateType === 'OFFSET' && s.dueDateOffset != null ? Math.abs(s.dueDateOffset) : null, [Validators.min(0), Validators.max(999)]],
            dueDateOffsetDir: [s?.dueDateType === 'OFFSET' && (s.dueDateOffset ?? 0) < 0 ? 'BEFORE' : 'AFTER', [Validators.required]],
            snoozeUntilType: [s?.snoozeUntilType ?? null],
            snoozeFixed:    [s?.snoozeUntilType === 'FIXED' && s?.snoozedUntil ? new Date(s.snoozedUntil + 'T00:00:00') : null],
            snoozeOffset:   [s?.snoozeUntilType === 'OFFSET' ? s.snoozeOffset : null, [Validators.min(0), Validators.max(999)]],
            snoozeOffsetAbs: [s?.snoozeUntilType === 'OFFSET' ? s.snoozeOffset : null, [Validators.min(0), Validators.max(999)]],
            recurring:      [s?.recurring ?? true]
        });

        // Sync dueDateOffsetAbs + dueDateOffsetDir → dueDateOffset (signé)
        const syncDueDate = () => {
            const abs = this.form.get('dueDateOffsetAbs')?.value;
            const dir = this.form.get('dueDateOffsetDir')?.value;
            if (abs === null || abs === undefined || abs === '') {
                this.form.get('dueDateOffset')?.setValue(null, { emitEvent: false });
            } else {
                const signed = Number(abs) * (dir === 'BEFORE' ? -1 : 1);
                this.form.get('dueDateOffset')?.setValue(signed, { emitEvent: false });
            }
        };
        this.subscriptions.add(this.form.get('dueDateOffsetAbs')!.valueChanges.subscribe(syncDueDate));
        this.subscriptions.add(this.form.get('dueDateOffsetDir')!.valueChanges.subscribe(syncDueDate));

        // Validators required dynamiques selon dueDateType
        const updateDueDateValidators = (type: string) => {
            const fixedCtrl = this.form.get('dueDateFixed')!;
            const absCtrl = this.form.get('dueDateOffsetAbs')!;
            if (type === 'FIXED') {
                fixedCtrl.setValidators([Validators.required]);
                absCtrl.setValidators([]);
            } else {
                fixedCtrl.setValidators([]);
                absCtrl.setValidators([Validators.required, Validators.min(0), Validators.max(999)]);
            }
            fixedCtrl.updateValueAndValidity({ emitEvent: false });
            absCtrl.updateValueAndValidity({ emitEvent: false });
        };
        updateDueDateValidators(this.form.get('dueDateType')!.value);
        this.subscriptions.add(this.form.get('dueDateType')!.valueChanges.subscribe(updateDueDateValidators));

        // Sync snoozeOffsetAbs → snoozeOffset (toujours positif)
        this.subscriptions.add(this.form.get('snoozeOffsetAbs')!.valueChanges.subscribe(v => {
            this.form.get('snoozeOffset')?.setValue(v === null || v === undefined || v === '' ? null : Number(v), { emitEvent: false });
        }));

        this.draftService.registerValidate(() => {
            this.form.markAllAsTouched();
            return this.form.valid;
        });

        this.draftService.registerDraft(() => {            if (this.form.invalid) return null;
            const raw = this.form.getRawValue();

            const dueDateType: DateInputType = raw.dueDateType ?? 'FIXED';
            const snoozeUntilType: DateInputType | null = raw.snoozeUntilType || null;

            return {
                title:         raw.title?.trim(),
                description:   raw.description?.trim() || null,
                responsible:   raw.responsible?.trim() || null,
                supplierInfo:  raw.supplierInfo?.trim() || null,
                dueDateType,
                dueDate:       dueDateType === 'FIXED' && raw.dueDateFixed ? this.formatDate(raw.dueDateFixed) : null,
                dueDateOffset: dueDateType === 'OFFSET' ? raw.dueDateOffset : null,
                snoozeUntilType,
                snoozedUntil:  snoozeUntilType === 'FIXED' && raw.snoozeFixed ? this.formatDate(raw.snoozeFixed) : null,
                snoozeOffset:  snoozeUntilType === 'OFFSET' ? raw.snoozeOffset : null,
                recurring:     raw.recurring ?? true
            };
        });
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
        this.draftService.unregisterDraft();
    }

    private formatDate(date: Date | string): string {
        if (typeof date === 'string') return date;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}
