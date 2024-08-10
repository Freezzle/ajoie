import dayjs from 'dayjs/esm';
import { IDimensionStand } from '../../entities/dimension-stand/dimension-stand.model';

export interface ISalon {
  id: string;
  referenceNumber?: number | null;
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
export type NewPriceStand = Omit<IPriceStandSalon, 'id'> & { id: null };

export interface IPriceStandSalon {
  id: string;
  price?: number | null;
  dimension?: IDimensionStand | null;
}

export type NewPriceStandSalon = Omit<IPriceStandSalon, 'id'> & { id: null };

export interface ISalonStats {
  nbStandValidated: 0;
  nbStandInTreatment: 0;
  nbStandRefused: 0;

  nbMealSaturdayMidday: 0;
  nbMealSaturdayEvening: 0;
  nbMealSundayMidday: 0;

  nbParticipationAcceptedPaid: 0;
  nbParticipationAcceptedUnpaid: 0;

  dimensionStats: [];
}
