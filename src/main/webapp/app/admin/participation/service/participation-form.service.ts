import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {IParticipation} from '../model/participation.interface';
import {IExhibitor} from '../../exhibitor/model/exhibitor.interface';
import {CustomValidatorModel} from '../../../shared/field-error/custom-validator.model';

export type ParticipationFormGroup = {
    id: FormControl<IParticipation['id'] | null>;
    registrationDate: FormControl<IParticipation['registrationDate'] | string | null>;
    therapistName: FormControl<IParticipation['therapistName'] | null>;
    modePaymentMeals: FormControl<IParticipation['modePaymentMeals'] | null>;
    invoiceSendingMethod: FormControl<IParticipation['invoiceSendingMethod'] | null>;
    nbMeal1: FormControl<IParticipation['nbMeal1'] | null>;
    nbMeal2: FormControl<IParticipation['nbMeal2'] | null>;
    nbMeal3: FormControl<IParticipation['nbMeal3'] | null>;
    acceptedChart: FormControl<IParticipation['acceptedChart'] | null>;
    acceptedContract: FormControl<IParticipation['acceptedContract'] | null>;
    needArrangement: FormControl<IParticipation['needArrangement'] | null>;
    status: FormControl<IParticipation['status'] | null>;
    hasOffer: FormControl<IParticipation['hasOffer'] | null>;
    offer: FormControl<IParticipation['offer'] | null>;
    crushOfHeart: FormControl<IParticipation['crushOfHeart'] | null>;
    guestOfHonor: FormControl<IParticipation['guestOfHonor'] | null>;
    additionnalInformation: FormControl<IParticipation['additionnalInformation'] | null>;
    extraInformation: FormControl<IParticipation['extraInformation'] | null>;
    exhibitor: FormControl<IParticipation['exhibitor'] | null>;
    salon: FormControl<IParticipation['salon'] | null>;
};

export type ParticipationFilterFormGroup = {
    fullName: FormControl<IExhibitor['fullName'] | null>;
    status: FormControl<IParticipation['status'] | null>;
};

@Injectable({providedIn: 'root'})
export class ParticipationFormService {
    createFilterFormGroup(): FormGroup<ParticipationFilterFormGroup> {
        return new FormGroup<ParticipationFilterFormGroup>({
            fullName: new FormControl(null),
            status: new FormControl(null),
        });
    }

    createParticipationFormGroup(participation: IParticipation | null): FormGroup<ParticipationFormGroup> {
        return new FormGroup<ParticipationFormGroup>({
            id: new FormControl({value: participation?.id ?? null, disabled: true}),
            registrationDate: new FormControl(participation?.registrationDate ?? null),
            therapistName: new FormControl(participation?.therapistName ?? null, Validators.required),
            invoiceSendingMethod: new FormControl(participation?.invoiceSendingMethod ?? null, Validators.required),
            modePaymentMeals: new FormControl(participation?.modePaymentMeals ?? null, Validators.required),
            nbMeal1: new FormControl(participation?.nbMeal1 ?? null, [
                Validators.required,
                CustomValidatorModel.onlyNumbers,
            ]),
            nbMeal2: new FormControl(participation?.nbMeal2 ?? null, [
                Validators.required,
                CustomValidatorModel.onlyNumbers,
            ]),
            nbMeal3: new FormControl(participation?.nbMeal3 ?? null, [
                Validators.required,
                CustomValidatorModel.onlyNumbers,
            ]),
            acceptedChart: new FormControl(participation?.acceptedChart ?? false, Validators.required),
            acceptedContract: new FormControl(participation?.acceptedContract ?? false, Validators.required),
            needArrangement: new FormControl(participation?.needArrangement ?? false, Validators.required),
            status: new FormControl(participation?.status ?? null, Validators.required),
            hasOffer: new FormControl(participation?.hasOffer ?? false, Validators.required),
            offer: new FormControl(participation?.offer ?? null),
            crushOfHeart: new FormControl(participation?.crushOfHeart ?? false, Validators.required),
            guestOfHonor: new FormControl(participation?.guestOfHonor ?? false, Validators.required),
            additionnalInformation: new FormControl(participation?.additionnalInformation ?? null),
            extraInformation: new FormControl(participation?.extraInformation ?? null),
            exhibitor: new FormControl(participation?.exhibitor ?? null, Validators.required),
            salon: new FormControl(participation?.salon ?? null, Validators.required),
        });
    }

    getParticipation(form: FormGroup<ParticipationFormGroup>): IParticipation {
        return form.getRawValue() as IParticipation
    }
}
