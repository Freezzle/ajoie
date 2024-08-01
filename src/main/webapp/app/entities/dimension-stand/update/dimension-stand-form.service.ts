import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IDimensionStand, NewDimensionStand } from '../dimension-stand.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IDimensionStand for edit and NewDimensionStandFormGroupInput for create.
 */
type DimensionStandFormGroupInput = IDimensionStand | PartialWithRequiredKeyOf<NewDimensionStand>;

type DimensionStandFormDefaults = Pick<NewDimensionStand, 'id'>;

type DimensionStandFormGroupContent = {
  id: FormControl<IDimensionStand['id'] | NewDimensionStand['id']>;
  dimension: FormControl<IDimensionStand['dimension']>;
};

export type DimensionStandFormGroup = FormGroup<DimensionStandFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class DimensionStandFormService {
  createDimensionStandFormGroup(dimensionStand: DimensionStandFormGroupInput = { id: null }): DimensionStandFormGroup {
    const dimensionStandRawValue = {
      ...this.getFormDefaults(),
      ...dimensionStand,
    };
    return new FormGroup<DimensionStandFormGroupContent>({
      id: new FormControl(
        { value: dimensionStandRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      dimension: new FormControl(dimensionStandRawValue.dimension, {
        validators: [Validators.required],
      }),
    });
  }

  getDimensionStand(form: DimensionStandFormGroup): IDimensionStand | NewDimensionStand {
    return form.getRawValue() as IDimensionStand | NewDimensionStand;
  }

  resetForm(form: DimensionStandFormGroup, dimensionStand: DimensionStandFormGroupInput): void {
    const dimensionStandRawValue = { ...this.getFormDefaults(), ...dimensionStand };
    form.reset(
      {
        ...dimensionStandRawValue,
        id: { value: dimensionStandRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): DimensionStandFormDefaults {
    return {
      id: null,
    };
  }
}
