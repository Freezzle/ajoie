import dayjs from 'dayjs/esm';

import { ISalon, NewSalon } from './salon.model';

export const sampleWithRequiredData: ISalon = {
  id: '1d0d2751-3ddd-4f93-926d-9f0a4455a500',
};

export const sampleWithPartialData: ISalon = {
  id: '55d6cb97-581f-4b00-96c5-7d690eeb374b',
};

export const sampleWithFullData: ISalon = {
  id: 'b8d7a6ca-4ca2-4607-b1a5-dc69309151b3',
  place: 'mairie d’autant que vouh',
  startingDate: dayjs('2024-07-21T02:28'),
  endingDate: dayjs('2024-07-20T21:20'),
};

export const sampleWithNewData: NewSalon = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
