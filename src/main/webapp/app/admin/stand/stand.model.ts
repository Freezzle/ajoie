import { IExponent } from 'app/entities/exponent/exponent.model';
import { ISalon } from 'app/entities/salon/salon.model';
import { IDimensionStand } from 'app/entities/dimension-stand/dimension-stand.model';
import dayjs from 'dayjs/esm';

export interface IStand {
  id: string;
  description?: string | null;
  nbMeal1?: number | null;
  nbMeal2?: number | null;
  nbMeal3?: number | null;
  shared?: boolean | null;
  nbTable?: number | null;
  nbChair?: number | null;
  needElectricity?: boolean | null;
  acceptedChart?: boolean | null;
  acceptedContract?: boolean | null;
  needArrangment?: boolean | null;
  isClosed?: boolean | null;
  exponent?: IExponent | null;
  salon?: ISalon | null;
  dimension?: IDimensionStand | null;
  registrationDate?: dayjs.Dayjs | null;
}

export type NewStand = Omit<IStand, 'id'> & { id: null };
