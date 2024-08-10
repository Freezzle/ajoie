import { Component, inject, input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { IInvoicingPlan, IParticipation } from '../participation.model';
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
import SendBooleanPipe from '../../../shared/pipe/send-boolean.pipe';

@Component({
  standalone: true,
  selector: 'jhi-participation-stats',
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
    SendBooleanPipe,
  ],
})
export class ParticipationDetailComponent implements OnInit {
  participation = input<IParticipation | null>(null);

  invoicingPlans$: Observable<IInvoicingPlan[]> | undefined;
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

  switchLock(idInvoicingPlan: string, idInvoice: string): void {
    this.participationService.switchLock(idInvoicingPlan, idInvoice).subscribe(() => {
      this.loadInvoices();
    });
  }

  sendInvoicingPlan(idInvoicingPlan: string): void {
    this.participationService.sendInvoicingPlan(idInvoicingPlan).subscribe(() => {
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
    this.invoicingPlans$ = this.participationService.getInvoicingPlans(this.participation()!.id).pipe(
      mergeMap((invoicingPlans: HttpResponse<IInvoicingPlan[]>) => {
        if (invoicingPlans.body) {
          return of(invoicingPlans.body);
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
