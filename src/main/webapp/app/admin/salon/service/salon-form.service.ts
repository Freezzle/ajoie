import {Injectable} from '@angular/core';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {ISalon} from '../model/salon.interface';
import {IPriceStandSalon} from '../model/price-stand-salon.interface';

export type PriceStandGroup = {
    id: FormControl<IPriceStandSalon['id'] | null>;
    price: FormControl<IPriceStandSalon['price'] | null>;
    dimension: FormControl<IPriceStandSalon['dimension'] | null>;
    heightMeter: FormControl<IPriceStandSalon['heightMeter'] | null>;
    widthMeter: FormControl<IPriceStandSalon['widthMeter'] | null>;
};

export type SalonFormGroup = {
    id: FormControl<ISalon['id'] | null>;
    referenceNumber: FormControl<ISalon['referenceNumber'] | null>;
    place: FormControl<ISalon['place'] | null>;
    startingDate: FormControl<ISalon['startingDate'] | string | null>;
    endingDate: FormControl<ISalon['endingDate'] | string | null>;
    priceMeal1: FormControl<ISalon['priceMeal1'] | null>;
    priceMeal2: FormControl<ISalon['priceMeal2'] | null>;
    priceMeal3: FormControl<ISalon['priceMeal3'] | null>;
    priceConference: FormControl<ISalon['priceConference'] | null>;
    priceWorkshop: FormControl<ISalon['priceWorkshop'] | null>;
    priceSharingStand: FormControl<ISalon['priceSharingStand'] | null>;
    priceStandSalons: FormArray<FormGroup<PriceStandGroup>>;
    extraInformation: FormControl<ISalon['extraInformation'] | null>;
};

@Injectable({providedIn: 'root'})
export class SalonFormService {
    createSalonFormGroup(salon: ISalon | null): FormGroup<SalonFormGroup> {
        const raw: ISalon = {
            ...this.getDefaultSalonFormValue() as ISalon,
            ...(salon ?? {}),
        };

        return new FormGroup<SalonFormGroup>({
            id: new FormControl({value: raw.id, disabled: true}),
            place: new FormControl(raw.place, {
                validators: [Validators.required, Validators.minLength(5), Validators.maxLength(50)],
            }),
            referenceNumber: new FormControl(raw.referenceNumber, {
                validators: [Validators.required, Validators.maxLength(10)],
            }),
            startingDate: new FormControl(raw.startingDate,
                {validators: [Validators.required]},
            ),
            endingDate: new FormControl(raw.endingDate,
                {validators: [Validators.required]},
            ),
            priceMeal1: new FormControl(raw.priceMeal1, Validators.required),
            priceMeal2: new FormControl(raw.priceMeal2, Validators.required),
            priceMeal3: new FormControl(raw.priceMeal3, Validators.required),
            priceConference: new FormControl(raw.priceConference, Validators.required),
            priceWorkshop: new FormControl(raw.priceWorkshop, Validators.required),
            priceSharingStand: new FormControl(raw.priceSharingStand, Validators.required),
            priceStandSalons: new FormArray<FormGroup<PriceStandGroup>>(
                (raw.priceStandSalons).map(priceStand => this.createPriceStand(priceStand)),
            ),
            extraInformation: new FormControl(raw.extraInformation)
        });
    }

    createPriceStand(priceStand: IPriceStandSalon | null): FormGroup<PriceStandGroup> {
        const raw = {
            ...this.getDefaultPriceDimensionFormValue() as IPriceStandSalon,
            ...priceStand ?? {}
        }
        return new FormGroup<PriceStandGroup>({
            id: new FormControl({value: raw.id, disabled: true}),
            price: new FormControl(raw.price, Validators.required),
            dimension: new FormControl(raw.dimension, Validators.required),
            widthMeter: new FormControl(raw.widthMeter, Validators.required),
            heightMeter: new FormControl(raw.heightMeter, Validators.required)
        })
    }

    getSalon(form: FormGroup<SalonFormGroup>): ISalon {
        return form.getRawValue() as ISalon;
    }

    private getDefaultSalonFormValue(): Pick<ISalon,
        'priceStandSalons'> {
        return {
            priceStandSalons: []
        };
    }

    private getDefaultPriceDimensionFormValue(): Pick<IPriceStandSalon,
        'widthMeter' | 'heightMeter'> {
        return {
            widthMeter: 0,
            heightMeter: 0
        };
    }
}
