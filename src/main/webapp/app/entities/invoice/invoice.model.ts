import dayjs from 'dayjs/esm';
import { Type } from '../enumerations/type.model';
import { IInvoicingPlan } from './invoicing-plan.model';

export interface IInvoice {
  id: string;
  generationDate?: dayjs.Dayjs | null;
  type?: Type | null;
  label?: string | null;
  defaultAmount?: number | null;
  customAmount?: number | null;
  quantity?: number | null;
  total?: number | null;
  lock?: boolean | null;
  extraInformation?: string | null;
  invoicingPlan?: IInvoicingPlan | null;
}

export type NewInvoice = Omit<IInvoice, 'id'> & { id: null };
