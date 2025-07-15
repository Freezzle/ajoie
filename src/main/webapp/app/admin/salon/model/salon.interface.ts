import dayjs from 'dayjs/esm';
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

export interface TimeSlot {
    id: string;
    label: string;
    start: string; // format HH:mm:ss
    end: string;
    date: string;  // format YYYY-MM-DD
    salonId: number;
}

export type TimeSlotMap = { [date: string]: TimeSlot[] };
