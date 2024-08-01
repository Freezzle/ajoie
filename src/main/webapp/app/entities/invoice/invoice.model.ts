import dayjs from 'dayjs/esm';
import { IParticipation } from 'app/entities/participation/participation.model';

export interface IInvoice {
  id: string;
  generationDate?: dayjs.Dayjs | null;
  label?: string | null;
  defaultAmount?: number | null;
  customAmount?: number | null;
  quantity?: number | null;
  total?: number | null;
  lock?: boolean | null;
  extraInformation?: string | null;
  participation?: IParticipation | null;
}

export type NewInvoice = Omit<IInvoice, 'id'> & { id: null };
