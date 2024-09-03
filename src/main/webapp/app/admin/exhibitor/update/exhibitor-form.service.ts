import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

import {IExhibitor, NewExhibitor} from '../exhibitor.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & {
    id: T['id'];
};

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IExhibitor for edit and NewExhibitorFormGroupInput for create.
 */
type ExhibitorFormGroupInput = IExhibitor | PartialWithRequiredKeyOf<NewExhibitor>;

type ExhibitorFormDefaults = Pick<NewExhibitor, 'id'>;

type ExhibitorFormGroupContent = {
    id: FormControl<IExhibitor['id'] | NewExhibitor['id']>;
    fullName: FormControl<IExhibitor['fullName']>;
    email: FormControl<IExhibitor['email']>;
    phoneNumber: FormControl<IExhibitor['phoneNumber']>;
    address: FormControl<IExhibitor['address']>;
    npaLocalite: FormControl<IExhibitor['npaLocalite']>;
    extraInformation: FormControl<IExhibitor['extraInformation']>;
};

export type ExhibitorFormGroup = FormGroup<ExhibitorFormGroupContent>;

type ExhibitorFilterFormGroupContent = {
    fullName: FormControl<IExhibitor['fullName']>;
    email: FormControl<IExhibitor['email']>;
};

export type ExhibitorFilterFormGroup = FormGroup<ExhibitorFilterFormGroupContent>;

@Injectable({providedIn: 'root'})
export class ExhibitorFormService {
    createFilterFormGroup(): ExhibitorFilterFormGroup {
        return new FormGroup<ExhibitorFilterFormGroupContent>({
            fullName: new FormControl(),
            email: new FormControl(),
        });
    }

    createExhibitorFormGroup(exhibitor: ExhibitorFormGroupInput = {id: null}): ExhibitorFormGroup {
        const exhibitorRawValue = {
            ...this.getFormDefaults(),
            ...exhibitor,
        };
        return new FormGroup<ExhibitorFormGroupContent>({
            id: new FormControl(
                {value: exhibitorRawValue.id, disabled: true},
                {
                    nonNullable: true,
                    validators: [Validators.required],
                },
            ),
            fullName: new FormControl(exhibitorRawValue.fullName, {
                validators: [Validators.required],
            }),
            email: new FormControl(exhibitorRawValue.email, {
                validators: [Validators.required],
            }),
            phoneNumber: new FormControl(exhibitorRawValue.phoneNumber),
            address: new FormControl(exhibitorRawValue.address),
            npaLocalite: new FormControl(exhibitorRawValue.npaLocalite),
            extraInformation: new FormControl(exhibitorRawValue.extraInformation),
        });
    }

    getExhibitor(form: ExhibitorFormGroup): IExhibitor | NewExhibitor {
        return form.getRawValue() as IExhibitor | NewExhibitor;
    }

    resetForm(form: ExhibitorFormGroup, exhibitor: ExhibitorFormGroupInput): void {
        const exhibitorRawValue = {...this.getFormDefaults(), ...exhibitor};
        form.reset(
            {
                ...exhibitorRawValue,
                id: {value: exhibitorRawValue.id, disabled: true},
            } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
        );
    }

    private getFormDefaults(): ExhibitorFormDefaults {
        return {
            id: null,
        };
    }
}
