import dayjs from 'dayjs/esm';
import {State} from '../../enumerations/state.model';
import {Type} from '../../enumerations/type.model';
import {Mode} from '../../enumerations/mode.model';
import {AvailableAction} from '../../../shared/model/available-action';
import {InvoiceSendingMethod} from "../../enumerations/invoice-sending-method.model";

export interface IInvoicingPlan {
    id: string;
    generationDate?: dayjs.Dayjs | null;
    issuedDate?: dayjs.Dayjs | null;
    expirationDate?: dayjs.Dayjs | null;
    needArrangement: boolean;
    invoiceSendingMethod: InvoiceSendingMethod;
    billingNumber?: string | null;
    state?: State | null;
    invoices?: IInvoice[];
    payments?: IPayment[];
    availableActions: AvailableAction[];
}

export interface IInvoice {
    id: string;
    readMode: boolean | null; // only frontend field
    generationDate?: dayjs.Dayjs | null;
    referenceId?: string | null;
    type?: Type | null;
    label?: string | null;
    defaultAmount?: number | null;
    customAmount?: number | null;
    quantity?: number | null;
    lock?: boolean | null;
    extraInformation?: string | null;
    selected: boolean;
}

export type NewInvoice = Omit<IInvoice, 'id'> & { id: null };

export interface IPayment {
    id: string;
    readMode: boolean | null; // only frontend field;
    billingDate?: dayjs.Dayjs | null;
    paymentMode?: Mode | null;
    amount?: number | null;
    extraInformation?: string | null;
}

export type NewPayment = Omit<IPayment, 'id'> & { id: null };
