import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Subscription} from 'rxjs';
import SharedModule from 'app/shared/shared.module';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {DateBoxComponent} from '../../../shared/components/date-box/date-box.component';
import {NumberBoxComponent} from '../../../shared/components/number-box/number-box.component';
import {CheckboxBoxComponent} from '../../../shared/components/checkbox-box/checkbox-box.component';
import {DialogDraftService} from '../../../shared/services/dialog-draft.service';
import {DateInputType, ISubtaskInstance} from '../model/task-instance.interface';
import {SubtaskInstanceFormGroup, SubtaskInstanceFormService} from '../service/subtask-instance-form.service';
import {DueDateControls, DueDateFieldComponent} from '../shared/due-date-field.component';
import {RepeatControls, RepeatFieldComponent} from '../shared/repeat-field.component';
import {ResponsibleFieldComponent} from '../shared/responsible-field.component';
import {salonDay} from '../shared/task-urgency.utils';
import {SelectButton} from 'primeng/selectbutton';
import {Popover} from 'primeng/popover';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'app-subtask-instance-form',
    templateUrl: './subtask-instance-form.component.html',
    imports: [
        SharedModule,
        ReactiveFormsModule,
        TextBoxComponent,
        TextareaBoxComponent,
        DateBoxComponent,
        NumberBoxComponent,
        CheckboxBoxComponent,
        DueDateFieldComponent,
        ResponsibleFieldComponent,
        RepeatFieldComponent,
        SelectButton,
        Popover
    ]
})
export class SubtaskInstanceFormComponent implements OnInit, OnDestroy {
    /** Données existantes en mode édition, null en mode création. */
    @Input() subtask: ISubtaskInstance | null = null;
    /** Date de début du salon (objet Date), utilisée pour prévisualiser la date estimée en mode OFFSET. */
    @Input() salonStartingDate: Date | null = null;
    /** Responsables déjà connus du salon, proposés dans la liste. */
    @Input() known: string[] = [];
    /** Responsable de la tâche parente, affiché quand le champ est vide. */
    @Input() taskResponsible: string | null = null;

    form!: FormGroup<SubtaskInstanceFormGroup>;
    private syncSubscription!: Subscription;

    private readonly subtaskFormService = inject(SubtaskInstanceFormService);
    private readonly draftService = inject(DialogDraftService);
    private readonly translate = inject(TranslateService);

    /** Début du salon au format `YYYY-MM-DD`, pour le champ d'échéance. */
    get salonStartDay(): string | null {
        return salonDay(this.salonStartingDate);
    }

    /** Vue restreinte du formulaire passée au champ d'échéance. */
    get dueDateForm(): FormGroup<DueDateControls> {
        return this.form as unknown as FormGroup<DueDateControls>;
    }

    /** Vue restreinte du formulaire passée au champ de répétition. */
    get repeatForm(): FormGroup<RepeatControls> {
        return this.form as unknown as FormGroup<RepeatControls>;
    }

    get dueDateType(): DateInputType {
        return this.form?.get('dueDateType')?.value ?? 'FIXED';
    }

    get snoozeUntilType(): DateInputType | null {
        return this.form?.get('snoozeUntilType')?.value ?? null;
    }

    get snoozeTypeOptions() {
        return [
            {label: this.translate.instant('task.dialog.snoozeNone'), value: null},
            {label: this.translate.instant('task.dialog.dueDateJN'), value: 'OFFSET'},
            {label: this.translate.instant('task.dialog.dueDateFixed'), value: 'FIXED'}
        ];
    }

    /** Date estimée du snooze = date d'échéance calculée + snoozeOffset (null si données insuffisantes). */
    get estimatedSnoozeDate(): string | null {
        const snoozeOffset = this.form?.get('snoozeOffset')?.value;
        if (snoozeOffset == null) return null;
        let baseDate: Date | null = null;
        if (this.dueDateType === 'OFFSET') {
            const dueOffset = this.form?.get('dueDateOffset')?.value;
            const start = this.salonStartDay;
            if (dueOffset != null && start) {
                baseDate = new Date(`${start}T00:00:00`);
                baseDate.setDate(baseDate.getDate() + Number(dueOffset));
            }
        } else if (this.dueDateType === 'FIXED') {
            const fixed = this.form?.get('dueDateFixed')?.value;
            if (fixed) baseDate = new Date(fixed);
        }
        if (!baseDate) return null;
        baseDate.setDate(baseDate.getDate() + Number(snoozeOffset));
        return baseDate.toLocaleDateString('fr-CH', {day: '2-digit', month: '2-digit', year: 'numeric'});
    }

    /** Date de début du salon formatée en jj.mm.yyyy (null si absente). */
    get salonStartingDateFormatted(): string | null {
        const day = this.salonStartDay;
        if (!day) return null;
        return new Date(`${day}T00:00:00`).toLocaleDateString('fr-CH', {day: '2-digit', month: '2-digit', year: 'numeric'});
    }

    ngOnInit(): void {
        this.form = this.subtaskFormService.createFormGroup(this.subtask);
        this.syncSubscription = this.subtaskFormService.registerSyncSubscriptions(this.form);

        this.draftService.registerValidate(() => {
            this.form.markAllAsTouched();
            return this.form.valid;
        });

        this.draftService.registerDraft(() => {
            if (this.form.invalid) return null;
            return this.subtaskFormService.getSubtaskInstance(this.form);
        });
    }

    ngOnDestroy(): void {
        this.syncSubscription.unsubscribe();
        this.draftService.unregisterDraft();
    }
}
