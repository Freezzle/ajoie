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

type ExponentFormDefaults = Pick<NewExponent, 'id' | 'blocked'>;

type ExponentFormGroupContent = {
  id: FormControl<IExponent['id'] | NewExponent['id']>;
  email: FormControl<IExponent['email']>;
  fullName: FormControl<IExponent['fullName']>;
  phoneNumber: FormControl<IExponent['phoneNumber']>;
  website: FormControl<IExponent['website']>;
  socialMedia: FormControl<IExponent['socialMedia']>;
  address: FormControl<IExponent['address']>;
  npaLocalite: FormControl<IExponent['npaLocalite']>;
  urlPicture: FormControl<IExponent['urlPicture']>;
  comment: FormControl<IExponent['comment']>;
  blocked: FormControl<IExponent['blocked']>;
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
      email: new FormControl(exponentRawValue.email),
      fullName: new FormControl(exponentRawValue.fullName),
      phoneNumber: new FormControl(exponentRawValue.phoneNumber),
      website: new FormControl(exponentRawValue.website),
      socialMedia: new FormControl(exponentRawValue.socialMedia),
      address: new FormControl(exponentRawValue.address),
      npaLocalite: new FormControl(exponentRawValue.npaLocalite),
      urlPicture: new FormControl(exponentRawValue.urlPicture),
      comment: new FormControl(exponentRawValue.comment),
      blocked: new FormControl(exponentRawValue.blocked),
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
      blocked: false,
    };
  }
}
