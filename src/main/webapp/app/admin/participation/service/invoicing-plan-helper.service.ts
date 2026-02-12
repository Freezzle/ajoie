import {Injectable} from '@angular/core';
import {State} from '../../enumerations/state.model';
import dayjs from 'dayjs/esm';

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
}
