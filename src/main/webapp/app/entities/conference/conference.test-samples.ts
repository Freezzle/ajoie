import { IConference, NewConference } from './conference.model';

export const sampleWithRequiredData: IConference = {
  id: '98789685-8ec6-4f93-a1d2-edaabb9fbf63',
};

export const sampleWithPartialData: IConference = {
  id: '4cfedca6-9b9c-4198-81e0-7fcc0a853b0a',
  title: 'assez',
};

export const sampleWithFullData: IConference = {
  id: 'f51e6580-19bc-4037-a1e4-f1f7af9c3e09',
  title: 'aussi pendant que rôder',
};

export const sampleWithNewData: NewConference = {
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
