import {Injectable} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';

import dayjs from 'dayjs/esm';
import {DATE_FORMAT} from 'app/config/input.constants';
import {IPriceStandSalon, ISalon, NewPriceStand, NewSalon} from '../salon.model';

type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };
type SalonFormGroupInput = ISalon | PartialWithRequiredKeyOf<NewSalon>;

type FormValueOf<T extends ISalon | NewSalon> = Omit<T, 'startingDate' | 'endingDate'> & {
    startingDate?: string | null;
    endingDate?: string | null;
};

type SalonFormRawValue = FormValueOf<ISalon>;
type PriceStandFormRawValue = FormValueOf<IPriceStandSalon>;

type NewSalonFormRawValue = FormValueOf<NewSalon>;

type SalonFormDefaults = Pick<NewSalon, 'id' | 'startingDate' | 'endingDate'>;

type PriceStandGroupContent = {
    id: FormControl<PriceStandFormRawValue['id'] | NewPriceStand['id']>;
    price: FormControl<PriceStandFormRawValue['price']>;
    dimension: FormControl<PriceStandFormRawValue['dimension']>;
};

type SalonFormGroupContent = {
    id: FormControl<SalonFormRawValue['id'] | NewSalon['id']>;
    referenceNumber: FormControl<SalonFormRawValue['referenceNumber']>;
    place: FormControl<SalonFormRawValue['place']>;
    startingDate: FormControl<SalonFormRawValue['startingDate']>;
    endingDate: FormControl<SalonFormRawValue['endingDate']>;
    priceMeal1: FormControl<SalonFormRawValue['priceMeal1']>;
    priceMeal2: FormControl<SalonFormRawValue['priceMeal2']>;
    priceMeal3: FormControl<SalonFormRawValue['priceMeal3']>;
    priceConference: FormControl<SalonFormRawValue['priceConference']>;
    priceSharingStand: FormControl<SalonFormRawValue['priceSharingStand']>;
    priceStandSalons: FormArray<PriceStandFormGroup>;
    extraInformation: FormControl<SalonFormRawValue['extraInformation']>;
};

export type SalonFormGroup = FormGroup<SalonFormGroupContent>;
export type PriceStandFormGroup = FormGroup<PriceStandGroupContent>;

@Injectable({providedIn: 'root'})
export class SalonFormService {
    createSalonFormGroup(salon: SalonFormGroupInput = {id: null}): SalonFormGroup {
        const salonRawValue = this.convertSalonToSalonRawValue({
            ...this.getFormDefaults(),
            ...salon,
        });

        return new FormGroup<SalonFormGroupContent>({
            id: new FormControl(salonRawValue.id),
            referenceNumber: new FormControl(salonRawValue.referenceNumber, {
                validators: [Validators.required],
            }),
            place: new FormControl(salonRawValue.place, {
                validators: [Validators.required],
            }),
            startingDate: new FormControl(salonRawValue.startingDate, {
                validators: [Validators.required],
            }),
            endingDate: new FormControl(salonRawValue.endingDate, {
                validators: [Validators.required],
            }),
            priceMeal1: new FormControl(salonRawValue.priceMeal1),
            priceMeal2: new FormControl(salonRawValue.priceMeal2),
            priceMeal3: new FormControl(salonRawValue.priceMeal3),
            priceConference: new FormControl(salonRawValue.priceConference),
            priceSharingStand: new FormControl(salonRawValue.priceSharingStand),
            priceStandSalons: new FormArray(
                salonRawValue.priceStandSalons?.map(
                    priceStand =>
                        new FormGroup<PriceStandGroupContent>({
                            id: new FormControl(priceStand.id),
                            price: new FormControl(priceStand.price),
                            dimension: new FormControl(priceStand.dimension),
                        }),
                ) ?? [],
            ),
            extraInformation: new FormControl(salonRawValue.extraInformation),
        });
    }

    getSalon(form: SalonFormGroup): ISalon | NewSalon {
        return this.convertSalonRawValueToSalon(form.getRawValue() as SalonFormRawValue | NewSalonFormRawValue);
    }

    private getFormDefaults(): SalonFormDefaults {
        const currentTime = dayjs();

        return {
            id: null,
            startingDate: currentTime,
            endingDate: currentTime,
        };
    }

    private convertSalonRawValueToSalon(rawSalon: SalonFormRawValue | NewSalonFormRawValue): ISalon | NewSalon {
        return {
            ...rawSalon,
            startingDate: dayjs(rawSalon.startingDate, DATE_FORMAT),
            endingDate: dayjs(rawSalon.endingDate, DATE_FORMAT),
        };
    }

    private convertSalonToSalonRawValue(
        salon: ISalon | (Partial<NewSalon> & SalonFormDefaults),
    ): SalonFormRawValue | PartialWithRequiredKeyOf<NewSalonFormRawValue> {
        return {
            ...salon,
            startingDate: salon.startingDate ? salon.startingDate.format(DATE_FORMAT) : undefined,
            endingDate: salon.endingDate ? salon.endingDate.format(DATE_FORMAT) : undefined,
        };
    }
}
