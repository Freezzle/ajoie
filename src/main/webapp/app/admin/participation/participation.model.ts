import dayjs from 'dayjs/esm';
import {ISalon} from '../salon/salon.model';
import {Status} from '../enumerations/status.model';
import {Type} from '../enumerations/type.model';
import {Mode} from '../enumerations/mode.model';
import {IExhibitor} from '../exhibitor/exhibitor.model';
import {State} from '../enumerations/state.model';

export interface IParticipation {
    id: string;
    registrationDate?: dayjs.Dayjs | null;
    type?: keyof typeof Type | null;
    clientNumber?: string | null;
    nbMeal1?: number | null;
    nbMeal2?: number | null;
    nbMeal3?: number | null;
    acceptedChart?: boolean | null;
    acceptedContract?: boolean | null;
    needArrangment?: boolean | null;
    isBillingClosed?: boolean | null;
    status?: keyof typeof Status | null;
    extraInformation?: string | null;
    exhibitor?: IExhibitor | null;
    salon?: ISalon | null;
}

export type NewParticipation = Omit<IParticipation, 'id'> & { id: null };

export interface IInvoicingPlan {
    id: string;
    generationDate?: dayjs.Dayjs | null;
    billingNumber?: string | null;
    state?: State | null;
    invoices?: IInvoice[];
    payments?: IPayment[];
}

export type NewInvoicingPlan = Omit<IInvoicingPlan, 'id'> & { id: null };

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
}

export type NewPayment = Omit<IPayment, 'id'> & { id: null };

export interface IPayment {
    id: string;
    readMode: boolean | null; // only frontend field;
    billingDate?: dayjs.Dayjs | null;
    paymentMode?: Mode | null;
    amount?: number | null;
    extraInformation?: string | null;
}

export type NewInvoice = Omit<IInvoice, 'id'> & { id: null };
