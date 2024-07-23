import { IDimensionStand, NewDimensionStand } from './dimension-stand.model';

export const sampleWithRequiredData: IDimensionStand = {
  id: '260b7b0a-d22f-4d92-a33d-4f8e1fdec7a7',
};

export const sampleWithPartialData: IDimensionStand = {
  id: 'b2bf0049-4c0c-4c24-9f34-b6448e117262',
  dimension: 'doucement',
};

export const sampleWithFullData: IDimensionStand = {
  id: '2f15c369-b5ba-4741-a26f-38eb220985a4',
  dimension: 'énergique à peu près',
};

export const sampleWithNewData: NewDimensionStand = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
