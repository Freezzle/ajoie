import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import SharedModule from 'app/shared/shared.module';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {DateBoxComponent} from '../../../shared/components/date-box/date-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {DialogDraftService} from '../../../shared/services/dialog-draft.service';
import {DateInputType, ISubtaskInstance} from '../model/task-instance.interface';
import {SelectButton} from 'primeng/selectbutton';
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
        SelectButton
    ]
})
export class SubtaskInstanceFormComponent implements OnInit, OnDestroy {
    /** Données existantes en mode édition, null en mode création. */
    @Input() subtask: ISubtaskInstance | null = null;

    form!: FormGroup;

    get dueDateTypeOptions() {
        return [
            { label: this.translate.instant('task.dialog.dueDateFixed'), value: 'FIXED' },
            { label: this.translate.instant('task.dialog.dueDateJN'), value: 'OFFSET' }
        ];
    }

    get snoozeTypeOptions() {
        return [
            { label: this.translate.instant('task.dialog.snoozeNone'), value: null },
            { label: this.translate.instant('task.dialog.dueDateFixed'), value: 'FIXED' },
            { label: this.translate.instant('task.dialog.dueDateJN'), value: 'OFFSET' }
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
            dueDateType:    [s?.dueDateType ?? 'FIXED'],
            dueDateFixed:   [s?.dueDateType === 'FIXED' && s?.dueDate ? new Date(s.dueDate + 'T00:00:00') : null],
            dueDateOffset:  [s?.dueDateType === 'OFFSET' ? s.dueDateOffset : null, [Validators.min(-365), Validators.max(365)]],
            snoozeUntilType: [s?.snoozeUntilType ?? null],
            snoozeFixed:    [s?.snoozeUntilType === 'FIXED' && s?.snoozedUntil ? new Date(s.snoozedUntil + 'T00:00:00') : null],
            snoozeOffset:   [s?.snoozeUntilType === 'OFFSET' ? s.snoozeOffset : null, [Validators.min(-365), Validators.max(365)]]
        });

        this.draftService.registerDraft(() => {
            if (this.form.invalid) return null;
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
                snoozeOffset:  snoozeUntilType === 'OFFSET' ? raw.snoozeOffset : null
            };
        });
    }

    ngOnDestroy(): void {
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
