import {IPriceStandSalon} from './price-stand-salon.interface';
import {IAddress} from '../../common/address.model';
import {IBankAccount} from '../../common/bank-account.model';

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
    headquartersAddress: IAddress | null;
    eventAddress: IAddress | null;
    bankAccount: IBankAccount;
    priceStandSalons: IPriceStandSalon[];
}

export type NewSalon = Omit<ISalon, 'id'> & { id: null };
