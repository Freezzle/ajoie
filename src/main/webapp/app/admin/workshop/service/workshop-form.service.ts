import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

import {IWorkshop} from '../model/workshop.interface';
import {IExhibitor} from '../../exhibitor/model/exhibitor.interface';

export type WorkshopFormGroup = {
    id: FormControl<IWorkshop['id'] | null>;
    title: FormControl<IWorkshop['title'] | null>;
    description: FormControl<IWorkshop['description'] | null>;
    status: FormControl<IWorkshop['status'] | null>;
    extraInformation: FormControl<IWorkshop['extraInformation'] | null>;
    participation: FormControl<IWorkshop['participation'] | null>;
};

export type WorkshopFilterFormGroup = {
    fullName: FormControl<IExhibitor['fullName'] | null>;
    status: FormControl<IWorkshop['status'] | null>;
};

@Injectable({providedIn: 'root'})
export class WorkshopFormService {
    createFilterFormGroup(): FormGroup<WorkshopFilterFormGroup> {
        return new FormGroup<WorkshopFilterFormGroup>({
            fullName: new FormControl(null),
            status: new FormControl(null),
        });
    }

    createWorkshopFormGroup(workshop: IWorkshop | null): FormGroup<WorkshopFormGroup> {
        return new FormGroup<WorkshopFormGroup>({
            id: new FormControl(workshop?.id ?? null),
            title: new FormControl(workshop?.title ?? null, [Validators.required]),
            description: new FormControl(workshop?.description ?? null, [
                Validators.required,
                Validators.maxLength(500),
            ]),
            status: new FormControl(workshop?.status ?? null, Validators.required),
            extraInformation: new FormControl(workshop?.extraInformation ?? null),
            participation: new FormControl(workshop?.participation ?? null, Validators.required),
        });
    }

    getWorkshop(form: FormGroup<WorkshopFormGroup>): IWorkshop {
        return form.getRawValue() as IWorkshop;
    }
}
