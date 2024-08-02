import dayjs from 'dayjs/esm';
import { IExponent } from 'app/entities/exponent/exponent.model';
import { ISalon } from 'app/entities/salon/salon.model';
import { Status } from 'app/entities/enumerations/status.model';
import { Type } from '../../entities/enumerations/type.model';

export interface IParticipation {
  id: string;
  registrationDate?: dayjs.Dayjs | null;
  type?: keyof typeof Type | null;
  nbMeal1?: number | null;
  nbMeal2?: number | null;
  nbMeal3?: number | null;
  acceptedChart?: boolean | null;
  acceptedContract?: boolean | null;
  needArrangment?: boolean | null;
  isBillingClosed?: boolean | null;
  status?: keyof typeof Status | null;
  extraInformation?: string | null;
  exponent?: IExponent | null;
  salon?: ISalon | null;
}

export type NewParticipation = Omit<IParticipation, 'id'> & { id: null };
