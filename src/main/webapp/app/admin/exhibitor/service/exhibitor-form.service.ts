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
    isoCountry: FormControl<IExhibitor['isoCountry'] | null>;
    extraInformation: FormControl<IExhibitor['extraInformation'] | null>;
    language: FormControl<IExhibitor['language'] | null>;
    differentBillingAddress: FormControl<IExhibitor['differentBillingAddress'] | null>;
    billingAddress: FormControl<IExhibitor['billingAddress'] | null>;
    newsletter: FormControl<IExhibitor['newsletter'] | null>;
    redFlag: FormControl<IExhibitor['redFlag'] | null>;
    duplicateDetected: FormControl<IExhibitor['duplicateDetected'] | null>;
};

export type ExhibitorFormGroup = FormGroup<ExhibitorFormGroupContent>;

@Injectable({providedIn: 'root'})
export class ExhibitorFormService {
    createExhibitorFormGroup(exhibitor: IExhibitor | null): ExhibitorFormGroup {
        const raw: IExhibitor = {
            ...this.getDefaultExhibitorFormValue() as IExhibitor,
            ...(exhibitor ?? {}),
        };

        return new FormGroup<ExhibitorFormGroupContent>({
            id: new FormControl({value: raw.id, disabled: true}),
            fullName: new FormControl(raw.fullName, Validators.required),
            email: new FormControl(raw.email, {validators: [Validators.required, Validators.email]}),
            phoneNumber: new FormControl(raw.phoneNumber, {validators: [this.phoneValidator()]}),
            address: new FormControl(raw.address, Validators.required),
            npaLocalite: new FormControl(raw.npaLocalite, Validators.required),
            isoCountry: new FormControl(raw.isoCountry, Validators.required),
            extraInformation: new FormControl(raw.extraInformation),
            language: new FormControl(raw.language, Validators.required),
            differentBillingAddress: new FormControl(raw.differentBillingAddress, Validators.required),
            billingAddress: new FormControl(raw.billingAddress),
            newsletter: new FormControl(raw.newsletter, Validators.required),
            redFlag: new FormControl(raw.redFlag, Validators.required),
            duplicateDetected: new FormControl(raw.duplicateDetected, Validators.required),
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

    private getDefaultExhibitorFormValue(): Pick<IExhibitor,
        'language' | 'differentBillingAddress' | 'isoCountry' | 'newsletter'
        | 'redFlag' | 'duplicateDetected'> {
        return {
            language: 'fr',
            isoCountry: 'CH',
            differentBillingAddress: false,
            newsletter: true,
            redFlag: false,
            duplicateDetected: false
        };
    }
}
