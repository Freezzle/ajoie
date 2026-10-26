import {Injectable} from '@angular/core';
import {State} from '../../enumerations/state.model';
import dayjs from 'dayjs/esm';
import {IInvoicingPlanList} from '../model/invoicing-plan.interface';

/** Catégorie de travail d'une facture, utilisée pour les groupes et les puces. */
export type InvoicingPlanBucket = 'todo' | 'wait' | 'late' | 'PAID' | 'CANCELLED';

/** Urgence d'un plan sans échéance : après les factures envoyées, avant les plans clos. */
const URGENCY_TODO = 500;
const URGENCY_CLOSED = 900;

@Injectable({providedIn: 'root'})
export class InvoicingPlanHelperService {

    calculateBalance(totalAmount: number | null | undefined, paidAmount: number | null | undefined): number {
        return (totalAmount ?? 0) - (paidAmount ?? 0);
    }

    getStateBadgeClass(state: State | null | undefined): string {
        switch (state) {
            case State.PAID:
                return 'bg-primary';
            case State.CANCELLED:
                return 'bg-danger';
            case State.ISSUED:
                return 'bg-info';
            case State.DRAFT:
            case State.ISOLATED:
            case State.IS_ISSUING:
                return 'bg-success';
            default:
                return 'bg-warning';
        }
    }

    isExpired(expirationDate: dayjs.Dayjs | null | undefined, state: State | null | undefined): boolean {
        if (!expirationDate || state !== State.ISSUED) {
            return false;
        }
        return dayjs().isAfter(expirationDate);
    }

    isDraft(state: State | null | undefined): boolean {
        return state === State.DRAFT || state === State.ISOLATED;
    }

    /** Catégorie de travail : à envoyer, en attente, échue, payée ou annulée. */
    bucket(plan: IInvoicingPlanList): InvoicingPlanBucket {
        if (this.isDraft(plan.state) || plan.state === State.IS_ISSUING) {
            return 'todo';
        }

        if (plan.state === State.ISSUED) {
            return this.isExpired(plan.expirationDate, plan.state) ? 'late' : 'wait';
        }

        return plan.state === State.PAID ? 'PAID' : 'CANCELLED';
    }

    /** Nombre de jours avant l'échéance (négatif si échue) ; le tri « Urgence » est croissant. */
    urgency(plan: IInvoicingPlanList): number {
        if (plan.state === State.ISSUED && plan.expirationDate) {
            return dayjs(plan.expirationDate).startOf('day').diff(dayjs().startOf('day'), 'day');
        }

        return this.bucket(plan) === 'todo' ? URGENCY_TODO : URGENCY_CLOSED;
    }

    /** Couleur du point de statut, cohérente avec les puces et les groupes. */
    stateColor(plan: IInvoicingPlanList): string {
        switch (this.bucket(plan)) {
            case 'late':
                return 'var(--app-status-refused)';
            case 'wait':
                return 'var(--app-status-accepted)';
            case 'PAID':
                return 'var(--app-status-validated)';
            case 'CANCELLED':
                return 'var(--app-status-canceled)';
            default:
                return 'var(--app-status-neutral)';
        }
    }

    /** Clé de traduction du statut affiché : une facture échue n'est plus « envoyée ». */
    stateLabelKey(plan: IInvoicingPlanList): string {
        return this.bucket(plan) === 'late' ? 'invoicingPlan.state.EXPIRED' : `invoicingPlan.state.${plan.state}`;
    }
}
