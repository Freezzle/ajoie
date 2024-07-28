import dayjs from 'dayjs/esm';
import { IStand } from '../../admin/stand/stand.model';

export interface IInvoice {
  id: string;
  amount?: number | null;
  billingDate?: dayjs.Dayjs | null;
  paymentMode?: string | null;
  extraInformation?: string | null;
  stand?: IStand | null;
}

export type NewInvoice = Omit<IInvoice, 'id'> & { id: null };
