import { IConfigurationSalon, NewConfigurationSalon } from './configuration-salon.model';

export const sampleWithRequiredData: IConfigurationSalon = {
  id: 'e6213549-9f97-4779-864d-206c0ed3c6d5',
};

export const sampleWithPartialData: IConfigurationSalon = {
  id: '64a3c932-9e0d-4377-8544-780f4329c00d',
  priceMeal1: 18785,
  priceMeal3: 6895,
  priceConference: 23487,
};

export const sampleWithFullData: IConfigurationSalon = {
  id: 'a22535ea-e9d8-4bd8-8c55-fed6dd6efd0d',
  priceMeal1: 25792,
  priceMeal2: 22853,
  priceMeal3: 5560,
  priceConference: 28467,
  priceSharingStand: 13040,
};

export const sampleWithNewData: NewConfigurationSalon = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
