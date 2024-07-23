import { Injectable } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';

import { IConfigurationSalon, NewConfigurationSalon } from '../configuration-salon.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IConfigurationSalon for edit and NewConfigurationSalonFormGroupInput for create.
 */
type ConfigurationSalonFormGroupInput = IConfigurationSalon | PartialWithRequiredKeyOf<NewConfigurationSalon>;

type ConfigurationSalonFormDefaults = Pick<NewConfigurationSalon, 'id'>;

type ConfigurationSalonFormGroupContent = {
  id: FormControl<IConfigurationSalon['id'] | NewConfigurationSalon['id']>;
  priceMeal1: FormControl<IConfigurationSalon['priceMeal1']>;
  priceMeal2: FormControl<IConfigurationSalon['priceMeal2']>;
  priceMeal3: FormControl<IConfigurationSalon['priceMeal3']>;
  priceConference: FormControl<IConfigurationSalon['priceConference']>;
  priceSharingStand: FormControl<IConfigurationSalon['priceSharingStand']>;
  salon: FormControl<IConfigurationSalon['salon']>;
};

export type ConfigurationSalonFormGroup = FormGroup<ConfigurationSalonFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ConfigurationSalonFormService {
  createConfigurationSalonFormGroup(configurationSalon: ConfigurationSalonFormGroupInput = { id: null }): ConfigurationSalonFormGroup {
    const configurationSalonRawValue = {
      ...this.getFormDefaults(),
      ...configurationSalon,
    };
    return new FormGroup<ConfigurationSalonFormGroupContent>({
      id: new FormControl(
        { value: configurationSalonRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      priceMeal1: new FormControl(configurationSalonRawValue.priceMeal1),
      priceMeal2: new FormControl(configurationSalonRawValue.priceMeal2),
      priceMeal3: new FormControl(configurationSalonRawValue.priceMeal3),
      priceConference: new FormControl(configurationSalonRawValue.priceConference),
      priceSharingStand: new FormControl(configurationSalonRawValue.priceSharingStand),
      salon: new FormControl(configurationSalonRawValue.salon),
    });
  }

  getConfigurationSalon(form: ConfigurationSalonFormGroup): IConfigurationSalon | NewConfigurationSalon {
    return form.getRawValue() as IConfigurationSalon | NewConfigurationSalon;
  }

  resetForm(form: ConfigurationSalonFormGroup, configurationSalon: ConfigurationSalonFormGroupInput): void {
    const configurationSalonRawValue = { ...this.getFormDefaults(), ...configurationSalon };
    form.reset(
      {
        ...configurationSalonRawValue,
        id: { value: configurationSalonRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): ConfigurationSalonFormDefaults {
    return {
      id: null,
    };
  }
}
