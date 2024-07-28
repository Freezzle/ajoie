import dayjs from 'dayjs/esm';

export interface ISalon {
  id: string;
  place?: string | null;
  startingDate?: dayjs.Dayjs | null;
  endingDate?: dayjs.Dayjs | null;
}

export type NewSalon = Omit<ISalon, 'id'> & { id: null };

export interface ISalonStats {
  nbStandValidated: 0;
  nbStandInTreatment: 0;
  nbStandRefused: 0;

  nbMealSaturdayMidday: 0;
  nbMealSaturdayEvening: 0;
  nbMealSundayMidday: 0;

  nbStandValidatedPaid: 0;
  nbStandValidatedUnpaid: 0;

  dimensionStats: [];
}
