import { IStand } from 'app/entities/stand/stand.model';

export interface IBilling {
  id: string;
  acceptedContract?: boolean | null;
  needArrangment?: boolean | null;
  isClosed?: boolean | null;
  stand?: IStand | null;
}

export type NewBilling = Omit<IBilling, 'id'> & { id: null };
