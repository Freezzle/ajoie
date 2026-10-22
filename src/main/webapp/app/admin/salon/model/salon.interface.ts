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
    archived: boolean;
    registrationEnabled: boolean;
    registrationOpeningDate: Date | null;
    registrationClosingDate: Date | null;
    registrationWelcomeTitle: string | null;
    registrationWelcomeText: string | null;
    sourceSalonId?: string | null;
    /** Compteurs du pied de la liste : prestations écartées exclues. */
    nbParticipations?: number;
    nbConferences?: number;
    nbWorkshops?: number;
}

export type NewSalon = Omit<ISalon, 'id'> & { id: null };
