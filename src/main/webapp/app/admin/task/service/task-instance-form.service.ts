import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ITaskInstance} from '../model/task-instance.interface';

export type TaskInstanceFormGroup = {
    title: FormControl<string>;
    description: FormControl<string | null>;
    responsible: FormControl<string | null>;
    supplierInfo: FormControl<string | null>;
};

@Injectable({providedIn: 'root'})
export class TaskInstanceFormService {

    createFormGroup(task: ITaskInstance | null): FormGroup<TaskInstanceFormGroup> {
        return new FormGroup<TaskInstanceFormGroup>({
            title: new FormControl(task?.title ?? '', {nonNullable: true, validators: [Validators.required, Validators.maxLength(500)]}),
            description: new FormControl(task?.description ?? null),
            responsible: new FormControl(task?.responsible ?? null),
            supplierInfo: new FormControl(task?.supplierInfo ?? null),
        });
    }

    getTaskInstance(form: FormGroup<TaskInstanceFormGroup>): Partial<ITaskInstance> {
        const raw = form.getRawValue();
        return {
            title: raw.title?.trim(),
            description: raw.description?.trim() || null,
            responsible: raw.responsible?.trim() || null,
            supplierInfo: raw.supplierInfo?.trim() || null,
        };
    }
}
