import { IExponent, NewExponent } from './exponent.model';

export const sampleWithRequiredData: IExponent = {
  id: '5ca1aa40-ecaf-474a-9d71-951c666dd5af',
};

export const sampleWithPartialData: IExponent = {
  id: 'cde6e7c5-c663-4337-99bf-2777d2a0ecfb',
  email: 'Sixtine55@hotmail.fr',
  fullName: 'magenta',
  phoneNumber: 'soutenir collègue égoïste',
  address: 'adversaire',
  npaLocalite: 'mature triathlète gratis',
};

export const sampleWithFullData: IExponent = {
  id: '36074f83-9f83-4676-a0d1-2c851c2a585b',
  email: 'Astarte_Boyer64@yahoo.fr',
  fullName: 'plutôt sans que',
  phoneNumber: 'collègue',
  website: 'divinement adhérer',
  socialMedia: 'quant à étant donné que quitte à',
  address: 'foule vouh ressentir',
  npaLocalite: 'euh magenta extrêmement',
  urlPicture: 'hormis de peur que',
  comment: 'réserver séculaire',
  blocked: true,
};

export const sampleWithNewData: NewExponent = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
