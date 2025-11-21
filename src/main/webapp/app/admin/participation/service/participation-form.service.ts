import {Injectable} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {IParticipation} from '../model/participation.interface';
import {CustomValidatorModel} from '../../../shared/field-error/custom-validator.model';
import {InvoiceSendingMethod} from "../../enumerations/invoice-sending-method.model";
import {ModePaymentMeals} from "../../enumerations/mode-payment-meals.model";
import {Status} from "../../enumerations/status.model";

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

@Injectable({providedIn: 'root'})
export class ParticipationFormService {
    createParticipationFormGroup(participation: IParticipation | null): FormGroup<ParticipationFormGroup> {
        const raw: IParticipation = {
            ...this.getDefaultParticipationFormValue() as IParticipation,
            ...(participation ?? {}),
        };

        return new FormGroup<ParticipationFormGroup>({
            id: new FormControl({value: raw.id, disabled: true}),
            registrationDate: new FormControl(raw.registrationDate),
            therapistName: new FormControl(raw.therapistName, Validators.required),
            invoiceSendingMethod: new FormControl(raw.invoiceSendingMethod, Validators.required),
            modePaymentMeals: new FormControl(raw.modePaymentMeals, Validators.required),
            nbMeal1: new FormControl(raw.nbMeal1, [
                Validators.required,
                CustomValidatorModel.onlyNumbers,
            ]),
            nbMeal2: new FormControl(raw.nbMeal2, [
                Validators.required,
                CustomValidatorModel.onlyNumbers,
            ]),
            nbMeal3: new FormControl(raw.nbMeal3, [
                Validators.required,
                CustomValidatorModel.onlyNumbers,
            ]),
            acceptedChart: new FormControl(raw.acceptedChart, Validators.required),
            acceptedContract: new FormControl(raw.acceptedContract, Validators.required),
            needArrangement: new FormControl(raw.needArrangement, Validators.required),
            status: new FormControl(raw.status, Validators.required),
            hasOffer: new FormControl(raw.hasOffer, Validators.required),
            offer: new FormControl(raw.offer),
            crushOfHeart: new FormControl(raw.crushOfHeart, Validators.required),
            guestOfHonor: new FormControl(raw.guestOfHonor, Validators.required),
            additionnalInformation: new FormControl(raw.additionnalInformation),
            extraInformation: new FormControl(raw.extraInformation),
            exhibitor: new FormControl(raw.exhibitor, Validators.required),
            salon: new FormControl(raw.salon, Validators.required),
        });
    }

    getParticipation(form: FormGroup<ParticipationFormGroup>): IParticipation {
        return form.getRawValue() as IParticipation
    }

    private getDefaultParticipationFormValue(): Pick<IParticipation,
        'registrationDate' | 'nbMeal1' | 'nbMeal2' | 'nbMeal3'
        | 'invoiceSendingMethod' | 'modePaymentMeals' | 'status' | 'hasOffer' | 'guestOfHonor' | 'crushOfHeart'
        | 'acceptedChart' | 'acceptedContract' | 'needArrangement'> {
        return {
            registrationDate: new Date(),
            invoiceSendingMethod: InvoiceSendingMethod.EMAIL,
            modePaymentMeals: ModePaymentMeals.MIXED,
            nbMeal1: 0,
            nbMeal2: 0,
            nbMeal3: 0,
            acceptedChart: false,
            acceptedContract: false,
            needArrangement: false,
            status: Status.IN_VERIFICATION,
            hasOffer: false,
            crushOfHeart: false,
            guestOfHonor: false
        };
    }
}
