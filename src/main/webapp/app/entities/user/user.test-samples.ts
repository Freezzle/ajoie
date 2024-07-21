import { IUser } from './user.model';

export const sampleWithRequiredData: IUser = {
  id: 6753,
  login: '.c',
};

export const sampleWithPartialData: IUser = {
  id: 28017,
  login: 'N@U_',
};

export const sampleWithFullData: IUser = {
  id: 4518,
  login: 'Zz@xQ\\zwO1Q\\/jG-\\!GNX\\wFat',
};
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
