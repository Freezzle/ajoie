import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IExponent, NewExponent } from '../exponent.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IExponent for edit and NewExponentFormGroupInput for create.
 */
type ExponentFormGroupInput = IExponent | PartialWithRequiredKeyOf<NewExponent>;

type ExponentFormDefaults = Pick<NewExponent, 'id'>;

type ExponentFormGroupContent = {
  id: FormControl<IExponent['id'] | NewExponent['id']>;
  fullName: FormControl<IExponent['fullName']>;
  email: FormControl<IExponent['email']>;
  phoneNumber: FormControl<IExponent['phoneNumber']>;
  address: FormControl<IExponent['address']>;
  npaLocalite: FormControl<IExponent['npaLocalite']>;
  extraInformation: FormControl<IExponent['extraInformation']>;
};

export type ExponentFormGroup = FormGroup<ExponentFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ExponentFormService {
  createExponentFormGroup(exponent: ExponentFormGroupInput = { id: null }): ExponentFormGroup {
    const exponentRawValue = {
      ...this.getFormDefaults(),
      ...exponent,
    };
    return new FormGroup<ExponentFormGroupContent>({
      id: new FormControl(
        { value: exponentRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      fullName: new FormControl(exponentRawValue.fullName, {
        validators: [Validators.required],
      }),
      email: new FormControl(exponentRawValue.email, {
        validators: [Validators.required],
      }),
      phoneNumber: new FormControl(exponentRawValue.phoneNumber),
      address: new FormControl(exponentRawValue.address),
      npaLocalite: new FormControl(exponentRawValue.npaLocalite),
      extraInformation: new FormControl(exponentRawValue.extraInformation),
    });
  }

  getExponent(form: ExponentFormGroup): IExponent | NewExponent {
    return form.getRawValue() as IExponent | NewExponent;
  }

  resetForm(form: ExponentFormGroup, exponent: ExponentFormGroupInput): void {
    const exponentRawValue = { ...this.getFormDefaults(), ...exponent };
    form.reset(
      {
        ...exponentRawValue,
        id: { value: exponentRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): ExponentFormDefaults {
    return {
      id: null,
    };
  }
}
