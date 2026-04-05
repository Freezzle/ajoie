import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import SharedModule from 'app/shared/shared.module';
import {TextBoxComponent} from '../../../shared/components/text-box/text-box.component';
import {TextareaBoxComponent} from '../../../shared/components/textarea-box/textarea-box.component';
import {DialogDraftService} from '../../../shared/services/dialog-draft.service';
import {ITaskInstance} from '../model/task-instance.interface';

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

    form!: FormGroup;

    private readonly fb = inject(FormBuilder);
    private readonly draftService = inject(DialogDraftService);

    get isEditMode(): boolean {
        return !!this.task;
    }

    ngOnInit(): void {
        this.form = this.fb.group({
            title: [this.task?.title ?? '', [Validators.required, Validators.maxLength(500)]],
            description: [this.task?.description ?? ''],
            responsible: [this.task?.responsible ?? ''],
            supplierInfo: [this.task?.supplierInfo ?? '']
        });

        this.draftService.registerDraft(() => {
            if (this.form.invalid) return null;
            const raw = this.form.getRawValue();
            return {
                title: raw.title?.trim(),
                description: raw.description?.trim() || null,
                responsible: raw.responsible?.trim() || null,
                supplierInfo: raw.supplierInfo?.trim() || null
            };
        });
    }

    ngOnDestroy(): void {
        this.draftService.unregisterDraft();
    }
}
