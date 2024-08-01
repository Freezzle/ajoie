import { IParticipation } from 'app/entities/participation/participation.model';
import { IDimensionStand } from 'app/entities/dimension-stand/dimension-stand.model';
import { Status } from 'app/entities/enumerations/status.model';

export interface IStand {
  id: string;
  description?: string | null;
  website?: string | null;
  socialMedia?: string | null;
  urlPicture?: string | null;
  shared?: boolean | null;
  nbTable?: number | null;
  nbChair?: number | null;
  needElectricity?: boolean | null;
  status?: keyof typeof Status | null;
  extraInformation?: string | null;
  participation?: IParticipation | null;
  dimension?: IDimensionStand | null;
}

export type NewStand = Omit<IStand, 'id'> & { id: null };
