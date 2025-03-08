import { IDimensionStand } from '../../dimension-stand/dimension-stand.model';

export interface IPriceStandSalon {
  id: string;
  price?: number | null;
  dimension?: IDimensionStand | null;
}

export type NewPriceStandSalon = Omit<IPriceStandSalon, 'id'> & { id: null };

export function sortPriceStandSalon(priceStands: IPriceStandSalon[]): IPriceStandSalon[] {
  return priceStands.sort((a, b) => {
    if (a?.dimension?.widthMeter === b?.dimension?.widthMeter) {
      return a?.dimension?.heightMeter ?? 0 - (b?.dimension?.heightMeter ?? 0);
    }
    return (a?.dimension?.widthMeter ?? 0) - (b?.dimension?.widthMeter ?? 0);
  });
}
