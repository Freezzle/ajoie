import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

import {IWorkshop} from '../model/workshop.interface';
import {IExhibitor} from '../../exhibitor/model/exhibitor.interface';
import {IStand} from "../../stand/model/stand.interface";
import {Status} from "../../enumerations/status.model";

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
        const raw: IWorkshop = {
            ...this.getDefaultWorkshopFormValue() as IWorkshop,
            ...(workshop ?? {}),
        };

        return new FormGroup<WorkshopFormGroup>({
            id: new FormControl(raw.id),
            title: new FormControl(raw.title, [Validators.required]),
            description: new FormControl(raw.description, [
                Validators.required,
                Validators.maxLength(500),
            ]),
            status: new FormControl(raw.status, Validators.required),
            extraInformation: new FormControl(raw.extraInformation),
            participation: new FormControl(raw.participation, Validators.required),
        });
    }

    getWorkshop(form: FormGroup<WorkshopFormGroup>): IWorkshop {
        return form.getRawValue() as IWorkshop;
    }

    private getDefaultWorkshopFormValue(): Pick<IWorkshop, 'status'> {
        return {
            status: Status.IN_VERIFICATION,
        };
    }
}
