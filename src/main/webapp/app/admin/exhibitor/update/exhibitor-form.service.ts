import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { IExhibitor, NewExhibitor } from '../exhibitor.model';

export type ExhibitorFormGroup = {
  id: FormControl<IExhibitor['id'] | NewExhibitor['id']>;
  fullName: FormControl<IExhibitor['fullName']>;
  therapistName: FormControl<IExhibitor['therapistName']>;
  email: FormControl<IExhibitor['email']>;
  phoneNumber: FormControl<IExhibitor['phoneNumber']>;
  address: FormControl<IExhibitor['address']>;
  npaLocalite: FormControl<IExhibitor['npaLocalite']>;
  extraInformation: FormControl<IExhibitor['extraInformation']>;
  language: FormControl<IExhibitor['language']>;
};

export type ExhibitorFilterFormGroup = {
  fullName: FormControl<IExhibitor['fullName']>;
  email: FormControl<IExhibitor['email']>;
};

@Injectable({ providedIn: 'root' })
export class ExhibitorFormService {
  createFilterFormGroup(): FormGroup<ExhibitorFilterFormGroup> {
    return new FormGroup<ExhibitorFilterFormGroup>({
      fullName: new FormControl(),
      email: new FormControl(),
    });
  }

  createExhibitorFormGroup(exhibitor: IExhibitor | NewExhibitor): FormGroup<ExhibitorFormGroup> {
    const exhibitorRawValue = {
      ...this.getFormDefaults(),
      ...exhibitor,
    };
    return new FormGroup<ExhibitorFormGroup>({
      id: new FormControl({ value: exhibitorRawValue.id, disabled: true }),
      fullName: new FormControl(exhibitorRawValue.fullName, {
        validators: [Validators.required],
      }),
      therapistName: new FormControl(exhibitorRawValue.therapistName),
      email: new FormControl(exhibitorRawValue.email, {
        validators: [Validators.required],
      }),
      phoneNumber: new FormControl(exhibitorRawValue.phoneNumber, {
        validators: [this.phoneValidator()],
      }),
      address: new FormControl(exhibitorRawValue.address),
      npaLocalite: new FormControl(exhibitorRawValue.npaLocalite),
      extraInformation: new FormControl(exhibitorRawValue.extraInformation),
      language: new FormControl(exhibitorRawValue.language, [Validators.required]),
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
        return { invalidPhoneNumber: true };
      }
      return null;
    };
  }

  getExhibitor(form: FormGroup<ExhibitorFormGroup>): IExhibitor | NewExhibitor {
    return form.getRawValue() as IExhibitor | NewExhibitor;
  }

  private getFormDefaults(): Pick<NewExhibitor, 'id'> {
    return {
      id: null,
    };
  }
}
