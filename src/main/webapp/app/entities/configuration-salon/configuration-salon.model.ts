import { ISalon } from 'app/entities/salon/salon.model';

export interface IConfigurationSalon {
  id: string;
  priceMeal1?: number | null;
  priceMeal2?: number | null;
  priceMeal3?: number | null;
  priceConference?: number | null;
  priceSharingStand?: number | null;
  salon?: ISalon | null;
}

export type NewConfigurationSalon = Omit<IConfigurationSalon, 'id'> & { id: null };
