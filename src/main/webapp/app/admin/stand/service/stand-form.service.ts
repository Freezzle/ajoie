import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {IStand} from '../model/stand.interface';
import {IExhibitor} from '../../exhibitor/model/exhibitor.interface';
import {CustomValidatorModel} from '../../../shared/field-error/custom-validator.model';

export type StandFormGroup = {
    id: FormControl<IStand['id'] | null>;
    description: FormControl<IStand['description'] | null>;
    website: FormControl<IStand['website'] | null>;
    instagram: FormControl<IStand['instagram'] | null>;
    facebook: FormControl<IStand['facebook'] | null>;
    urlPicture: FormControl<IStand['urlPicture'] | null>;
    shared: FormControl<IStand['shared'] | null>;
    nbTable: FormControl<IStand['nbTable'] | null>;
    nbChair: FormControl<IStand['nbChair'] | null>;
    needElectricity: FormControl<IStand['needElectricity'] | null>;
    status: FormControl<IStand['status'] | null>;
    category: FormControl<IStand['category'] | null>;
    extraInformation: FormControl<IStand['extraInformation'] | null>;
    participation: FormControl<IStand['participation'] | null>;
    dimension: FormControl<IStand['dimension'] | null>;
};

export type StandFilterFormGroup = {
    fullName: FormControl<IExhibitor['fullName'] | null>;
    status: FormControl<IStand['status'] | null>;
};

@Injectable({providedIn: 'root'})
export class StandFormService {
    createFilterFormGroup(): FormGroup<StandFilterFormGroup> {
        return new FormGroup<StandFilterFormGroup>({
            fullName: new FormControl(null),
            status: new FormControl(null),
        });
    }

    createStandFormGroup(stand: IStand | null): FormGroup<StandFormGroup> {
        return new FormGroup<StandFormGroup>({
            id: new FormControl(stand?.id ?? null),
            description: new FormControl(stand?.description ?? null, [
                Validators.required,
                Validators.maxLength(500),
            ]),
            website: new FormControl(stand?.website ?? null),
            instagram: new FormControl(stand?.instagram ?? null),
            facebook: new FormControl(stand?.facebook ?? null),
            urlPicture: new FormControl(stand?.urlPicture ?? null),
            shared: new FormControl(stand?.shared ?? false, Validators.required),
            nbTable: new FormControl(stand?.nbTable ?? null, [
                Validators.required,
                CustomValidatorModel.onlyNumbers,
            ]),
            nbChair: new FormControl(stand?.nbChair ?? null, [
                Validators.required,
                CustomValidatorModel.onlyNumbers,
            ]),
            needElectricity: new FormControl(stand?.needElectricity ?? true, Validators.required),
            status: new FormControl(stand?.status ?? null, Validators.required),
            category: new FormControl(stand?.category ?? null),
            extraInformation: new FormControl(stand?.extraInformation ?? null),
            participation: new FormControl(stand?.participation ?? null, Validators.required),
            dimension: new FormControl(stand?.dimension ?? null, Validators.required),
        });
    }

    getStand(form: FormGroup<StandFormGroup>): IStand {
        return form.getRawValue() as IStand;
    }
}
