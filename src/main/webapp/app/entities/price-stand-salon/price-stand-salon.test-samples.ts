import { IPriceStandSalon, NewPriceStandSalon } from './price-stand-salon.model';

export const sampleWithRequiredData: IPriceStandSalon = {
  id: 'e6252d23-7ba5-4b07-9cb3-7b4101c79b84',
};

export const sampleWithPartialData: IPriceStandSalon = {
  id: 'c57d5df7-2408-4aca-b3c2-9aacd5c8d3e7',
};

export const sampleWithFullData: IPriceStandSalon = {
  id: '77f117c9-1653-43a3-8fec-493d44a3ae61',
  price: 28079,
};

export const sampleWithNewData: NewPriceStandSalon = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
