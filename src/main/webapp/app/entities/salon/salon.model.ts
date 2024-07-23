import dayjs from 'dayjs/esm';

export interface ISalon {
  id: string;
  place?: string | null;
  startingDate?: dayjs.Dayjs | null;
  endingDate?: dayjs.Dayjs | null;
}

export type NewSalon = Omit<ISalon, 'id'> & { id: null };
