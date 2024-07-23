import { IStand, NewStand } from './stand.model';

export const sampleWithRequiredData: IStand = {
  id: 'bf595eeb-f00d-443d-bf8d-a307dc0f1752',
};

export const sampleWithPartialData: IStand = {
  id: '3ab85a2e-e848-4d96-b3c4-629e862dccf9',
  description: 'glouglou composer pacifique',
  nbMeal2: 23333,
  nbMeal3: 2914,
  nbChair: 29416,
};

export const sampleWithFullData: IStand = {
  id: 'f4927858-0fa7-4206-a17e-284cf83f9551',
  description: 'brusque dehors',
  nbMeal1: 15110,
  nbMeal2: 3829,
  nbMeal3: 10209,
  shared: true,
  nbTable: 3523,
  nbChair: 1435,
  needElectricity: true,
  acceptedChart: true,
};

export const sampleWithNewData: NewStand = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
