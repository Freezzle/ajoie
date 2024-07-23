import { IBilling, NewBilling } from './billing.model';

export const sampleWithRequiredData: IBilling = {
  id: 'e377b102-8975-43c0-900e-ca2548eb629c',
};

export const sampleWithPartialData: IBilling = {
  id: '0c760da3-d1d3-4860-843e-b2dcd95f5586',
};

export const sampleWithFullData: IBilling = {
  id: '2e74edea-bc0f-4394-9127-a66f2a1358bf',
  acceptedContract: true,
  needArrangment: true,
  isClosed: false,
};

export const sampleWithNewData: NewBilling = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
