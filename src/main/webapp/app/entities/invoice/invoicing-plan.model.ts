import dayjs from 'dayjs/esm';
import { IParticipation } from 'app/entities/participation/participation.model';
import { IInvoice } from './invoice.model';

export interface IInvoicingPlan {
  id: string;
  generationDate?: dayjs.Dayjs | null;
  billingNumber?: number | null;
  participation?: IParticipation | null;
  invoices?: IInvoice[] | undefined;
}

export type NewInvoice = Omit<IInvoicingPlan, 'id'> & { id: null };
