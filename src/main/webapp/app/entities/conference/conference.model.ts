import { IParticipation } from 'app/entities/participation/participation.model';
import { Status } from 'app/entities/enumerations/status.model';

export interface IConference {
  id: string;
  title?: string | null;
  status?: keyof typeof Status | null;
  extraInformation?: string | null;
  participation?: IParticipation | null;
}

export type NewConference = Omit<IConference, 'id'> & { id: null };
