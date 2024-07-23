import dayjs from 'dayjs/esm';

import { IInvoice, NewInvoice } from './invoice.model';

export const sampleWithRequiredData: IInvoice = {
  id: '8ea25af9-df7b-487d-bf8e-a978d6c506bf',
};

export const sampleWithPartialData: IInvoice = {
  id: '9ea10646-23b9-4da8-80aa-81d952efccf9',
  amount: 31507.58,
  paymentMode: 'commis rapide ouf',
  extraInformation: 'pin-pon',
};

export const sampleWithFullData: IInvoice = {
  id: '1e176824-b071-4812-90b7-d8a339fa9050',
  amount: 6861.27,
  billingDate: dayjs('2024-07-21T07:39'),
  paymentMode: 'compromettre miam en dehors de',
  extraInformation: 'de ah',
};

export const sampleWithNewData: NewInvoice = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
