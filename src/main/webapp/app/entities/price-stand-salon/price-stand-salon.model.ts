import { IDimensionStand } from 'app/entities/dimension-stand/dimension-stand.model';
import { ISalon } from 'app/entities/salon/salon.model';

export interface IPriceStandSalon {
  id: string;
  price?: number | null;
  dimension?: IDimensionStand | null;
  salon?: ISalon | null;
}

export type NewPriceStandSalon = Omit<IPriceStandSalon, 'id'> & { id: null };
