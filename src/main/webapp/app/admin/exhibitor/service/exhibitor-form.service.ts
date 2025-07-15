import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

import {IExhibitor} from '../model/exhibitor.interface';

type ExhibitorFormGroupContent = {
    id: FormControl<IExhibitor['id'] | null>;
    fullName: FormControl<IExhibitor['fullName'] | null>;
    email: FormControl<IExhibitor['email'] | null>;
    phoneNumber: FormControl<IExhibitor['phoneNumber'] | null>;
    address: FormControl<IExhibitor['address'] | null>;
    npaLocalite: FormControl<IExhibitor['npaLocalite'] | null>;
    extraInformation: FormControl<IExhibitor['extraInformation'] | null>;
    language: FormControl<IExhibitor['language'] | null>;
    differentBillingAddress: FormControl<IExhibitor['differentBillingAddress'] | null>;
    billingAddress: FormControl<IExhibitor['billingAddress'] | null>;
    newsletter: FormControl<IExhibitor['newsletter'] | null>;
    redFlag: FormControl<IExhibitor['redFlag'] | null>;
    duplicateDetected: FormControl<IExhibitor['duplicateDetected'] | null>;
};

export type ExhibitorFormGroup = FormGroup<ExhibitorFormGroupContent>;

export type ExhibitorFilterFormGroup = {
    fullName: FormControl<IExhibitor['fullName'] | null>;
    email: FormControl<IExhibitor['email'] | null>;
};

@Injectable({providedIn: 'root'})
export class ExhibitorFormService {
    createFilterFormGroup(): FormGroup<ExhibitorFilterFormGroup> {
        return new FormGroup<ExhibitorFilterFormGroup>({
            fullName: new FormControl(null),
            email: new FormControl(null)
        });
    }

    createExhibitorFormGroup(exhibitor: IExhibitor | null): ExhibitorFormGroup {
        return new FormGroup<ExhibitorFormGroupContent>({
            id: new FormControl(
                {value: exhibitor?.id ?? null, disabled: true}
            ),
            fullName: new FormControl(exhibitor?.fullName ?? null, {
                validators: [Validators.required]
            }),
            email: new FormControl(exhibitor?.email ?? null, {
                validators: [Validators.required, Validators.email]
            }),
            phoneNumber: new FormControl(exhibitor?.phoneNumber ?? null, {
                validators: [this.phoneValidator()]
            }),
            address: new FormControl(exhibitor?.address ?? null),
            npaLocalite: new FormControl(exhibitor?.npaLocalite ?? null),
            extraInformation: new FormControl(exhibitor?.extraInformation ?? null),
            language: new FormControl(exhibitor?.language ?? 'fr', {
                validators: [Validators.required]
            }),
            differentBillingAddress: new FormControl(
                exhibitor?.differentBillingAddress ?? false, {
                    validators: [Validators.required]
                }
            ),
            billingAddress: new FormControl(exhibitor?.billingAddress ?? null),
            newsletter: new FormControl(exhibitor?.newsletter ?? true, {
                validators: [Validators.required]
            }),
            redFlag: new FormControl(exhibitor?.redFlag ?? false, {
                validators: [Validators.required]
            }),
            duplicateDetected: new FormControl(exhibitor?.duplicateDetected ?? false, {
                validators: [Validators.required]
            }),
        });
    }

    phoneValidator() {
        const frenchRegex = /^(\+33|0)[1-9](\d{2}){4}$/; // Format pour les numéros français
        const swissRegex = /^(\+41|0)(7[5-9]|2[1-9])(\d{7})$/; // Format pour les numéros suisses

        return (control: any) => {
            const value = control.value;
            if (!value) {
                return null;
            }

            const isValidFrench = frenchRegex.test(value);
            const isValidSwiss = swissRegex.test(value);

            if (!isValidFrench && !isValidSwiss) {
                return {phonenumber: {requiredPattern: '(+33|0)... | (+41|0)...'}};
            }
            return null;
        };
    }

    getExhibitor(form: ExhibitorFormGroup): IExhibitor {
        return form.getRawValue() as IExhibitor;
    }
}
