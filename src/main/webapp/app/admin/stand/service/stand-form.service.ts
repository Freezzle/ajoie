import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {IStand} from '../model/stand.interface';
import {IExhibitor} from '../../exhibitor/model/exhibitor.interface';
import {CustomValidatorModel} from '../../../shared/field-error/custom-validator.model';
import {IParticipation} from "../../participation/model/participation.interface";
import {InvoiceSendingMethod} from "../../enumerations/invoice-sending-method.model";
import {ModePaymentMeals} from "../../enumerations/mode-payment-meals.model";
import {Status} from "../../enumerations/status.model";

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
        const raw: IStand = {
            ...this.getDefaultStandFormValue() as IStand,
            ...(stand ?? {}),
        };

        return new FormGroup<StandFormGroup>({
            id: new FormControl(raw.id),
            description: new FormControl(raw.description, [
                Validators.required,
                Validators.maxLength(500),
            ]),
            website: new FormControl(raw.website),
            instagram: new FormControl(raw.instagram),
            facebook: new FormControl(raw.facebook),
            urlPicture: new FormControl(raw.urlPicture),
            shared: new FormControl(raw.shared, Validators.required),
            nbTable: new FormControl(raw.nbTable, [
                Validators.required,
                CustomValidatorModel.onlyNumbers,
            ]),
            nbChair: new FormControl(raw.nbChair, [
                Validators.required,
                CustomValidatorModel.onlyNumbers,
            ]),
            needElectricity: new FormControl(raw.needElectricity, Validators.required),
            status: new FormControl(raw.status, Validators.required),
            category: new FormControl(raw.category),
            extraInformation: new FormControl(raw.extraInformation),
            participation: new FormControl(raw.participation, Validators.required),
            dimension: new FormControl(raw.dimension, Validators.required),
        });
    }

    getStand(form: FormGroup<StandFormGroup>): IStand {
        return form.getRawValue() as IStand;
    }

    private getDefaultStandFormValue(): Pick<IStand,
        'status' | 'nbTable' | 'nbChair' | 'needElectricity'
        | 'shared'> {
        return {
            status: Status.IN_VERIFICATION,
            nbTable: 0,
            nbChair: 0,
            needElectricity: true,
            shared: false
        };
    }
}
