import dayjs from 'dayjs/esm';
import { IBilling } from 'app/entities/billing/billing.model';

export interface IInvoice {
  id: string;
  amount?: number | null;
  billingDate?: dayjs.Dayjs | null;
  paymentMode?: string | null;
  extraInformation?: string | null;
  billing?: IBilling | null;
}

export type NewInvoice = Omit<IInvoice, 'id'> & { id: null };
