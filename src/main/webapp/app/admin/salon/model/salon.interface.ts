import {IPriceStandSalon} from './price-stand-salon.interface';

export interface ISalon {
    id: string;
    referenceNumber: string;
    place: string;
    startingDate: Date;
    endingDate: Date;
    priceMeal1: number;
    priceMeal2: number;
    priceMeal3: number;
    priceConference: number;
    priceWorkshop: number;
    priceSharingStand: number;
    extraInformation: string | null;
    priceStandSalons: IPriceStandSalon[];
}

export type NewSalon = Omit<ISalon, 'id'> & { id: null };
