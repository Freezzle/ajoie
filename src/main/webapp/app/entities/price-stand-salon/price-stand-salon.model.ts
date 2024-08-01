import { ISalon } from 'app/entities/salon/salon.model';
import { IDimensionStand } from 'app/entities/dimension-stand/dimension-stand.model';

export interface IPriceStandSalon {
  id: string;
  price?: number | null;
  salon?: ISalon | null;
  dimension?: IDimensionStand | null;
}

export type NewPriceStandSalon = Omit<IPriceStandSalon, 'id'> & { id: null };
