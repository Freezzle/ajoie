import { Status } from '../enumerations/status.model';
import { IParticipation } from '../participation/participation.model';

export interface IConference {
  id: string;
  title?: string | null;
  status?: keyof typeof Status | null;
  extraInformation?: string | null;
  participation?: IParticipation | null;
}

export type NewConference = Omit<IConference, 'id'> & { id: null };
