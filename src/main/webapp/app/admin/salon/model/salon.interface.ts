import dayjs from 'dayjs/esm';
import { IPriceStandSalon } from './price-stand-salon.interface';

export interface ISalon {
  id: string;
  referenceNumber?: string | null;
  place?: string | null;
  startingDate?: dayjs.Dayjs | null;
  endingDate?: dayjs.Dayjs | null;
  priceMeal1?: number | null;
  priceMeal2?: number | null;
  priceMeal3?: number | null;
  priceConference?: number | null;
  priceSharingStand?: number | null;
  extraInformation?: string | null;
  priceStandSalons?: IPriceStandSalon[] | null;
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
