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
        return new FormGroup<SalonFormGroup>({
            id: new FormControl({value: salon?.id ?? null, disabled: true}),
            place: new FormControl(salon?.place ?? null, {
                validators: [Validators.required, Validators.minLength(5), Validators.maxLength(50)],
            }),
            referenceNumber: new FormControl(salon?.referenceNumber ?? null, {
                validators: [Validators.required, Validators.maxLength(10)],
            }),
            startingDate: new FormControl(salon?.startingDate ?? null,
                {validators: [Validators.required]},
            ),
            endingDate: new FormControl(salon?.endingDate ?? null,
                {validators: [Validators.required]},
            ),
            priceMeal1: new FormControl(salon?.priceMeal1 ?? null, Validators.required),
            priceMeal2: new FormControl(salon?.priceMeal2 ?? null, Validators.required),
            priceMeal3: new FormControl(salon?.priceMeal3 ?? null, Validators.required),
            priceConference: new FormControl(salon?.priceConference ?? null, Validators.required),
            priceWorkshop: new FormControl(salon?.priceWorkshop ?? null, Validators.required),
            priceSharingStand: new FormControl(salon?.priceSharingStand ?? null, Validators.required),
            priceStandSalons: new FormArray<FormGroup<PriceStandGroup>>(
                (salon?.priceStandSalons ?? []).map(priceStand => this.createPriceStand(priceStand)),
            ),
            extraInformation: new FormControl(salon?.extraInformation ?? null)
        });
    }

    createPriceStand(priceStand: IPriceStandSalon | null): FormGroup<PriceStandGroup> {
        return new FormGroup<PriceStandGroup>({
            id: new FormControl({value: priceStand?.id ?? null, disabled: true}),
            price: new FormControl(priceStand?.price ?? null, Validators.required),
            dimension: new FormControl(priceStand?.dimension ?? null, Validators.required),
            widthMeter: new FormControl(priceStand?.widthMeter ?? null, Validators.required),
            heightMeter: new FormControl(priceStand?.heightMeter ?? null, Validators.required)
        })
    }

    getSalon(form: FormGroup<SalonFormGroup>): ISalon {
        return form.getRawValue() as ISalon;
    }
}
