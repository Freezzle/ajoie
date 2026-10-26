import dayjs from 'dayjs/esm';
import {State} from '../../enumerations/state.model';
import {Type} from '../../enumerations/type.model';
import {Mode} from '../../enumerations/mode.model';
import {AvailableAction} from '../../../shared/model/available-action';
import {InvoiceSendingMethod} from '../../enumerations/invoice-sending-method.model';
import {InvoiceNature} from '../../enumerations/invoice-nature.model';
import {IExhibitor} from '../../exhibitor/model/exhibitor.interface';

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

export interface IInvoicingPlanList {
    id: string;
    billingNumber?: string | null;
    state?: State | null;
    generationDate?: dayjs.Dayjs | null;
    issuedDate?: dayjs.Dayjs | null;
    expirationDate?: dayjs.Dayjs | null;
    invoiceSendingMethod?: InvoiceSendingMethod | null;
    needArrangement?: boolean | null;
    participation?: IParticipationLight | null;
    nbInvoiceLines?: number | null;
    totalAmount?: number | null;
    paidAmount?: number | null;
    balance?: number | null;
    /** Vrai si au moins une ligne a un montant différent du montant par défaut. */
    hasCustomPrice?: boolean | null;
    lastPaymentDate?: dayjs.Dayjs | null;
    /** Rappels envoyés, les plus anciens d'abord. */
    reminders?: IInvoicingPlanReminder[] | null;
}

/** Rappel de paiement envoyé pour une facture. */
export interface IInvoicingPlanReminder {
    sentDate?: dayjs.Dayjs | null;
    /**
     * Échéance du plan au moment de l'envoi : l'échéance courante est repoussée après une
     * relance, celle-ci explique le rappel. Nulle pour les rappels d'avant cette mémorisation.
     */
    dueDateAtSend?: dayjs.Dayjs | null;
}

export interface IParticipationLight {
    id: string;
    exhibitor?: IExhibitor | null;
    therapistName?: string | null;
}

export interface IInvoice {
    id: string;
    readMode: boolean | null; // only frontend field
    generationDate?: dayjs.Dayjs | null;
    referenceId?: string | null;
    type?: Type | null;
    nature?: InvoiceNature | null;
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
    /** Libellé imprimé sur la facture et la quittance. */
    label?: string | null;
    /** Note interne de l'administration, jamais reprise sur un document client. */
    extraInformation?: string | null;
}

export type NewPayment = Omit<IPayment, 'id'> & { id: null };
