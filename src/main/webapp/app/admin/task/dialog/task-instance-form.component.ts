import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormGroup, ReactiveFormsModule} from '@angular/forms';
import SharedModule from 'app/shared/shared.module';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {DialogDraftService} from '../../../shared/services/dialog-draft.service';
import {ITaskInstance} from '../model/task-instance.interface';
import {TaskInstanceFormGroup, TaskInstanceFormService} from '../service/task-instance-form.service';

@Component({
    selector: 'app-task-instance-form',
    templateUrl: './task-instance-form.component.html',
    imports: [
        CommonModule,
        SharedModule,
        ReactiveFormsModule,
        TextBoxComponent,
        TextareaBoxComponent
    ]
})
export class TaskInstanceFormComponent implements OnInit, OnDestroy {
    /** Données existantes en mode édition, null en mode création. */
    @Input() task: ITaskInstance | null = null;

    form!: FormGroup<TaskInstanceFormGroup>;

    private readonly taskInstanceFormService = inject(TaskInstanceFormService);
    private readonly draftService = inject(DialogDraftService);

    ngOnInit(): void {
        this.form = this.taskInstanceFormService.createFormGroup(this.task);

        this.draftService.registerDraft(() => {
            if (this.form.invalid) return null;
            return this.taskInstanceFormService.getTaskInstance(this.form);
        });
    }

    ngOnDestroy(): void {
        this.draftService.unregisterDraft();
    }
}
