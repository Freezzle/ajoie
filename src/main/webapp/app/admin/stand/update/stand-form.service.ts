import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IStand, NewStand } from '../stand.model';
import { Status } from '../../enumerations/status.model';
import { IExhibitor } from '../../exhibitor/exhibitor.model';
import { CustomValidatorModel } from '../../../shared/field-error/custom-validator.model';

export type StandFormGroup = {
  id: FormControl<IStand['id'] | NewStand['id']>;
  description: FormControl<IStand['description']>;
  website: FormControl<IStand['website']>;
  instagram: FormControl<IStand['instagram']>;
  facebook: FormControl<IStand['facebook']>;
  urlPicture: FormControl<IStand['urlPicture']>;
  shared: FormControl<IStand['shared']>;
  nbTable: FormControl<IStand['nbTable']>;
  nbChair: FormControl<IStand['nbChair']>;
  needElectricity: FormControl<IStand['needElectricity']>;
  status: FormControl<IStand['status']>;
  category: FormControl<IStand['category']>;
  extraInformation: FormControl<IStand['extraInformation']>;
  participation: FormControl<IStand['participation']>;
  dimension: FormControl<IStand['dimension']>;
  position: FormControl<IStand['position']>;
};

export type StandFilterFormGroup = {
  fullName: FormControl<IExhibitor['fullName']>;
  status: FormControl<IStand['status']>;
};

@Injectable({ providedIn: 'root' })
export class StandFormService {
  createFilterFormGroup(): FormGroup<StandFilterFormGroup> {
    return new FormGroup<StandFilterFormGroup>({
      fullName: new FormControl(),
      status: new FormControl(),
    });
  }

  createStandFormGroup(stand: IStand | NewStand): FormGroup<StandFormGroup> {
    const standRawValue = {
      ...this.getFormDefaults(),
      ...stand,
    };
    return new FormGroup<StandFormGroup>({
      id: new FormControl(standRawValue.id),
      description: new FormControl(standRawValue.description, [
        Validators.required,
        Validators.maxLength(500),
      ]),
      website: new FormControl(standRawValue.website),
      instagram: new FormControl(standRawValue.instagram),
      facebook: new FormControl(standRawValue.facebook),
      urlPicture: new FormControl(standRawValue.urlPicture),
      shared: new FormControl(standRawValue.shared),
      nbTable: new FormControl(standRawValue.nbTable, [
        Validators.required,
        CustomValidatorModel.onlyNumbers,
      ]),
      nbChair: new FormControl(standRawValue.nbChair, [
        Validators.required,
        CustomValidatorModel.onlyNumbers,
      ]),
      needElectricity: new FormControl(standRawValue.needElectricity),
      status: new FormControl(standRawValue.status, Validators.required),
      category: new FormControl(standRawValue.category),
      extraInformation: new FormControl(standRawValue.extraInformation),
      participation: new FormControl(standRawValue.participation, Validators.required),
      dimension: new FormControl(standRawValue.dimension, Validators.required),
      position: new FormControl(standRawValue.position),
    });
  }

  getStand(form: FormGroup<StandFormGroup>): IStand | NewStand {
    return form.getRawValue() as IStand | NewStand;
  }

  private getFormDefaults(): Pick<NewStand, 'id' | 'shared' | 'needElectricity' | 'status'> {
    return {
      id: null,
      shared: false,
      needElectricity: false,
      status: Status.IN_VERIFICATION,
    };
  }
}
