import { ISalon } from 'app/entities/salon/salon.model';
import { IExponent } from 'app/entities/exponent/exponent.model';

export interface IConference {
  id: string;
  title?: string | null;
  salon?: ISalon | null;
  exponent?: IExponent | null;
}

export type NewConference = Omit<IConference, 'id'> & { id: null };
