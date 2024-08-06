import { Component, inject, input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { IParticipation } from '../participation.model';
import { ParticipationService } from '../service/participation.service';
import { IInvoice } from '../../../entities/invoice/invoice.model';
import { EMPTY, map, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { InvoiceService } from '../../../entities/invoice/service/invoice.service';
import { FormsModule } from '@angular/forms';
import CheckBoolPipe from '../../../shared/pipe/check-boolean.pipe';
import ColorBoolPipe from '../../../shared/pipe/color-boolean.pipe';
import { IPayment } from '../../../entities/payment/payment.model';
import ColorLockBooleanPipe from '../../../shared/pipe/color-lock-boolean.pipe';
import LockBooleanPipe from '../../../shared/pipe/lock-boolean.pipe';
import { IInvoicingPlan } from '../../../entities/invoice/invoicing-plan.model';

@Component({
  standalone: true,
  selector: 'jhi-participation-detail',
  templateUrl: './participation-detail.component.html',
  imports: [
    SharedModule,
    RouterModule,
    DurationPipe,
    FormatMediumDatetimePipe,
    FormatMediumDatePipe,
    FormsModule,
    CheckBoolPipe,
    ColorBoolPipe,
    ColorLockBooleanPipe,
    LockBooleanPipe,
  ],
})
export class ParticipationDetailComponent implements OnInit {
  participation = input<IParticipation | null>(null);

  invoices$: Observable<IInvoice[]> | undefined;
  payments$: Observable<IPayment[]> | undefined;
  active = 'detail';

  protected participationService = inject(ParticipationService);

  protected invoicingPlanService = inject(InvoiceService);

  ngOnInit(): void {
    this.loadInvoices();
    this.loadPayments();
  }

  previousState(): void {
    window.history.back();
  }

  generate(): void {
    this.participationService.generateInvoices(this.participation()!.id).subscribe(() => {
      this.loadInvoices();
    });
  }

  deleteInvoice(invoice: IInvoice): void {
    this.invoicingPlanService.delete(invoice.id).subscribe(() => {
      this.loadInvoices();
    });
  }

  deletePayment(payment: IPayment): void {}

  totalDefault(invoices: IInvoice[]): number {
    return (
      invoices
        .map(invoice => invoice.defaultAmount)
        .reduce((previousValue, defaultAmount) => 0 + (previousValue ?? 0) + (defaultAmount ?? 0)) ?? 0
    );
  }

  totalInvoices(invoices: IInvoice[]): number {
    return (
      invoices.map(invoice => invoice.total).reduce((previousValue, defaultAmount) => 0 + (previousValue ?? 0) + (defaultAmount ?? 0)) ?? 0
    );
  }

  totalPayments(payments: IPayment[]): number {
    return (
      payments.map(payment => payment.amount).reduce((previousValue, defaultAmount) => 0 + (previousValue ?? 0) + (defaultAmount ?? 0)) ?? 0
    );
  }

  loadInvoices(): void {
    this.invoices$ = this.participationService.getInvoicingPlans(this.participation()!.id).pipe(
      mergeMap((invoicingPlans: HttpResponse<IInvoicingPlan[]>) => {
        if (invoicingPlans.body) {
          const invoicingPlan = invoicingPlans.body.reduce((max, current) =>
            current.billingNumber && max.billingNumber ? (current.billingNumber > max.billingNumber ? current : max) : current,
          );
          if (invoicingPlan.invoices) {
            return of(invoicingPlan.invoices);
          } else {
            return EMPTY;
          }
        } else {
          return EMPTY;
        }
      }),
    );
  }

  loadPayments(): void {
    this.payments$ = this.participationService.getPayments(this.participation()!.id).pipe(
      mergeMap((payments: HttpResponse<IPayment[]>) => {
        if (payments.body) {
          return of(payments.body);
        }
        return EMPTY;
      }),
    );
  }
}
