import { IAuthority, NewAuthority } from './authority.model';

export const sampleWithRequiredData: IAuthority = {
  name: 'f917eedb-8b87-4626-ac01-097e215703e5',
};

export const sampleWithPartialData: IAuthority = {
  name: '7d553959-4bdc-4da2-bb88-c7c548e026fa',
};

export const sampleWithFullData: IAuthority = {
  name: '7113e26e-5a30-4253-9bc7-e018b2c7dfcc',
};

export const sampleWithNewData: NewAuthority = {
  name: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
