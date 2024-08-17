import { Component, inject, input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import { IBillingLine, IInvoice, IInvoicingPlan, IParticipation, IPayment, IRecapBilling } from '../participation.model';
import { ParticipationService } from '../service/participation.service';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import CheckBoolPipe from '../../../shared/pipe/check-boolean.pipe';
import ColorBoolPipe from '../../../shared/pipe/color-boolean.pipe';
import ColorLockBooleanPipe from '../../../shared/pipe/color-lock-boolean.pipe';
import LockBooleanPipe from '../../../shared/pipe/lock-boolean.pipe';
import SendBooleanPipe from '../../../shared/pipe/send-boolean.pipe';
import EventTypePipe from '../../../shared/pipe/event-type.pipe';
import { Type } from '../../enumerations/type.model';

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
    ReactiveFormsModule,
    EventTypePipe,
  ],
})
export class ParticipationDetailComponent implements OnInit {
  participation = input<IParticipation | null>(null);

  invoicingPlans$: Observable<IInvoicingPlan[]> | undefined;
  payments$: Observable<IPayment[]> | undefined;
  eventLogs$: Observable<any[]> | undefined;
  recapBilling$: Observable<IRecapBilling> | undefined;
  active = 'detail';
  isSending = false;

  protected participationService = inject(ParticipationService);

  ngOnInit(): void {
    this.loadInvoices();
    this.loadPayments();
    this.loadEventLogs();
    this.loadRecapBilling();
  }

  previousState(): void {
    window.history.back();
  }

  generate(): void {
    this.participationService.generateInvoices(this.participation()!.id).subscribe(() => {
      this.loadInvoices();
      this.loadRecapBilling();
    });
  }

  sendInvoicingPlan(invoicingPlan: IInvoicingPlan): void {
    this.isSending = true;
    this.participationService.sendInvoicingPlan(invoicingPlan.id).subscribe(() => {
      this.loadInvoices();
      this.loadEventLogs();
      this.isSending = false;
    });
  }

  onClickLock(invoice: IInvoice): void {
    invoice.lock = !invoice.lock;
  }

  onCustomAmountChange(event: any, invoice: IInvoice): void {
    invoice.customAmount = event.target.value;
  }

  onExtraInformationChange(event: any, invoice: IInvoice): void {
    invoice.extraInformation = event.target.value;
  }

  totalDefault(invoices: IInvoice[]): number {
    return invoices
      .map(invoice => Number(invoice.defaultAmount))
      .reduce((previousValue, defaultAmount) => previousValue + defaultAmount, 0);
  }

  totalCustom(invoices: IInvoice[]): number {
    return invoices.map(invoice => Number(invoice.customAmount)).reduce((previousValue, customAmount) => previousValue + customAmount, 0);
  }

  totalInvoices(invoices: IInvoice[]): number {
    return invoices
      .map(invoice => (invoice.quantity ?? 1) * (invoice.customAmount ?? 0))
      .reduce((previousValue, defaultAmount) => previousValue + defaultAmount, 0);
  }

  totalPayments(payments: IPayment[]): number {
    return (
      payments.map(payment => payment.amount).reduce((previousValue, defaultAmount) => (previousValue ?? 0) + (defaultAmount ?? 0), 0) ?? 0
    );
  }

  totalDebit(lines: IBillingLine[]): number {
    return (
      lines
        .filter(line => line.amount && line.amount < 0)
        .map(line => line.amount)
        .reduce((previousValue, defaultAmount) => (previousValue ?? 0) + (defaultAmount ?? 0), 0) ?? 0
    );
  }

  totalCredit(lines: IBillingLine[]): number {
    return (
      lines
        .filter(line => line.amount && line.amount >= 0)
        .map(line => line.amount)
        .reduce((previousValue, defaultAmount) => (previousValue ?? 0) + (defaultAmount ?? 0), 0) ?? 0
    );
  }

  totalRecap(lines: IBillingLine[]): number {
    if (lines.length === 0) {
      return 0;
    }

    return lines.map(line => line.amount ?? 0).reduce((previousValue, defaultAmount) => previousValue + defaultAmount);
  }

  loadInvoices(): void {
    this.invoicingPlans$ = this.participationService.getInvoicingPlans(this.participation()!.id).pipe(
      mergeMap((invoicingPlans: HttpResponse<IInvoicingPlan[]>) => {
        if (invoicingPlans.body) {
          const invoicingPlansList = invoicingPlans.body;

          invoicingPlansList.forEach(ipl => {
            ipl.invoices?.forEach(invoice => {
              invoice.readMode = true;
            });
          });
          return of(invoicingPlansList);
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

  loadEventLogs(): void {
    this.eventLogs$ = this.participationService.getEventLogs(this.participation()!.id).pipe(
      mergeMap((events: HttpResponse<any[]>) => {
        if (events.body) {
          return of(events.body);
        }
        return EMPTY;
      }),
    );
  }

  loadRecapBilling(): void {
    this.recapBilling$ = this.participationService.getRecap(this.participation()!.id).pipe(
      mergeMap((recap: HttpResponse<IRecapBilling>) => {
        if (recap.body) {
          return of(recap.body);
        }
        return EMPTY;
      }),
    );
  }

  readActionInvoice(invoicingPlan: IInvoicingPlan, invoice: IInvoice): void {
    invoice.readMode = true;
    this.participationService.updateInvoice(invoicingPlan.id, invoice).subscribe(invoiceBack => {
      if (invoiceBack.body) {
        invoice.customAmount = invoiceBack.body.customAmount;
        invoice.extraInformation = invoiceBack.body.extraInformation;
        invoice.lock = invoiceBack.body.lock;
        this.loadEventLogs();
        this.loadRecapBilling();
      }
    });
  }

  editActionInvoice(invoice: IInvoice): void {
    invoice.readMode = false;
  }

  mustBeReadMode(invoice: IInvoice, invoicingPlan: IInvoicingPlan): boolean {
    return !!invoice.readMode || !!invoicingPlan.hasBeenSent || !!this.participation()?.isBillingClosed;
  }

  mustDisableSendButton(invoicingPlan: IInvoicingPlan): boolean {
    return this.isSending || !invoicingPlan.invoices?.every((inv: IInvoice) => inv.readMode);
  }

  protected readonly Type = Type;
}
