import { IParticipation } from '../../participation/model/participation.interface';
import { IDimensionStand } from '../../dimension-stand/dimension-stand.model';
import { Status } from '../../enumerations/status.model';
import { Category } from '../../enumerations/category.model';

export interface IStand {
  id: string;
  description?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  urlPicture?: string | null;
  shared?: boolean | null;
  nbTable?: number | null;
  nbChair?: number | null;
  needElectricity?: boolean | null;
  status?: keyof typeof Status | null;
  category?: keyof typeof Category | null;
  extraInformation?: string | null;
  participation?: IParticipation | null;
  dimension?: IDimensionStand | null;
}

export type NewStand = Omit<IStand, 'id'> & { id: null };
