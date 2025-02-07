import dayjs from 'dayjs/esm';
import { IDimensionStand } from '../dimension-stand/dimension-stand.model';

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

export interface IPriceStandSalon {
  id: string;
  price?: number | null;
  dimension?: IDimensionStand | null;
}

export type NewPriceStandSalon = Omit<IPriceStandSalon, 'id'> & { id: null };

export interface ISalonStats {
  dimensionStands: Record<string, number>;
  nbConference: number;
  nbStands: number;
  nbMeal1: number;
  nbMeal2: number;
  nbMeal3: number;
  nbGuestOfHonor: number;
  nbCrushOfHeart: number;
  standInfo: {
    nbTable: number;
    nbChair: number;
    nbElectricity: number;
    nbOffer: number;
  };
  categoriesStands: Record<string, number>;
  facturation: {
    paid: number;
    discount: number;
    expected: number;
  };
}

export function sortPriceStandSalon(priceStands: IPriceStandSalon[]): IPriceStandSalon[] {
  return priceStands.sort((a, b) => {
    if (a?.dimension?.widthMeter === b?.dimension?.widthMeter) {
      return a?.dimension?.heightMeter ?? 0 - (b?.dimension?.heightMeter ?? 0);
    }
    return (a?.dimension?.widthMeter ?? 0) - (b?.dimension?.widthMeter ?? 0);
  });
}
