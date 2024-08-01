import dayjs from 'dayjs/esm';
import { IParticipation } from 'app/entities/participation/participation.model';
import { Mode } from 'app/entities/enumerations/mode.model';

export interface IPayment {
  id: string;
  amount?: number | null;
  billingDate?: dayjs.Dayjs | null;
  paymentMode?: keyof typeof Mode | null;
  extraInformation?: string | null;
  participation?: IParticipation | null;
}

export type NewPayment = Omit<IPayment, 'id'> & { id: null };
