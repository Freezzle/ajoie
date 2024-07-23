import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IBilling, NewBilling } from '../billing.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IBilling for edit and NewBillingFormGroupInput for create.
 */
type BillingFormGroupInput = IBilling | PartialWithRequiredKeyOf<NewBilling>;

type BillingFormDefaults = Pick<NewBilling, 'id' | 'acceptedContract' | 'needArrangment' | 'isClosed'>;

type BillingFormGroupContent = {
  id: FormControl<IBilling['id'] | NewBilling['id']>;
  acceptedContract: FormControl<IBilling['acceptedContract']>;
  needArrangment: FormControl<IBilling['needArrangment']>;
  isClosed: FormControl<IBilling['isClosed']>;
  stand: FormControl<IBilling['stand']>;
};

export type BillingFormGroup = FormGroup<BillingFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class BillingFormService {
  createBillingFormGroup(billing: BillingFormGroupInput = { id: null }): BillingFormGroup {
    const billingRawValue = {
      ...this.getFormDefaults(),
      ...billing,
    };
    return new FormGroup<BillingFormGroupContent>({
      id: new FormControl(
        { value: billingRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      acceptedContract: new FormControl(billingRawValue.acceptedContract),
      needArrangment: new FormControl(billingRawValue.needArrangment),
      isClosed: new FormControl(billingRawValue.isClosed),
      stand: new FormControl(billingRawValue.stand),
    });
  }

  getBilling(form: BillingFormGroup): IBilling | NewBilling {
    return form.getRawValue() as IBilling | NewBilling;
  }

  resetForm(form: BillingFormGroup, billing: BillingFormGroupInput): void {
    const billingRawValue = { ...this.getFormDefaults(), ...billing };
    form.reset(
      {
        ...billingRawValue,
        id: { value: billingRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): BillingFormDefaults {
    return {
      id: null,
      acceptedContract: false,
      needArrangment: false,
      isClosed: false,
    };
  }
}
