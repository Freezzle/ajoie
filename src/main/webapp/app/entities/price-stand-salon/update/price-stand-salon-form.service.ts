import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IPriceStandSalon, NewPriceStandSalon } from '../price-stand-salon.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IPriceStandSalon for edit and NewPriceStandSalonFormGroupInput for create.
 */
type PriceStandSalonFormGroupInput = IPriceStandSalon | PartialWithRequiredKeyOf<NewPriceStandSalon>;

type PriceStandSalonFormDefaults = Pick<NewPriceStandSalon, 'id'>;

type PriceStandSalonFormGroupContent = {
  id: FormControl<IPriceStandSalon['id'] | NewPriceStandSalon['id']>;
  price: FormControl<IPriceStandSalon['price']>;
  salon: FormControl<IPriceStandSalon['salon']>;
  dimension: FormControl<IPriceStandSalon['dimension']>;
};

export type PriceStandSalonFormGroup = FormGroup<PriceStandSalonFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class PriceStandSalonFormService {
  createPriceStandSalonFormGroup(priceStandSalon: PriceStandSalonFormGroupInput = { id: null }): PriceStandSalonFormGroup {
    const priceStandSalonRawValue = {
      ...this.getFormDefaults(),
      ...priceStandSalon,
    };
    return new FormGroup<PriceStandSalonFormGroupContent>({
      id: new FormControl(
        { value: priceStandSalonRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      price: new FormControl(priceStandSalonRawValue.price, {
        validators: [Validators.required],
      }),
      salon: new FormControl(priceStandSalonRawValue.salon),
      dimension: new FormControl(priceStandSalonRawValue.dimension),
    });
  }

  getPriceStandSalon(form: PriceStandSalonFormGroup): IPriceStandSalon | NewPriceStandSalon {
    return form.getRawValue() as IPriceStandSalon | NewPriceStandSalon;
  }

  resetForm(form: PriceStandSalonFormGroup, priceStandSalon: PriceStandSalonFormGroupInput): void {
    const priceStandSalonRawValue = { ...this.getFormDefaults(), ...priceStandSalon };
    form.reset(
      {
        ...priceStandSalonRawValue,
        id: { value: priceStandSalonRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): PriceStandSalonFormDefaults {
    return {
      id: null,
    };
  }
}
