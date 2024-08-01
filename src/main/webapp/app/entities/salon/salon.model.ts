import dayjs from 'dayjs/esm';

export interface ISalon {
  id: string;
  place?: string | null;
  startingDate?: dayjs.Dayjs | null;
  endingDate?: dayjs.Dayjs | null;
  priceMeal1?: number | null;
  priceMeal2?: number | null;
  priceMeal3?: number | null;
  priceConference?: number | null;
  priceSharingStand?: number | null;
  extraInformation?: string | null;
}

export type NewSalon = Omit<ISalon, 'id'> & { id: null };
