import { Component, inject, input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import { IInvoice, IInvoicingPlan, IParticipation, IPayment } from '../participation.model';
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
import { State } from '../../enumerations/state.model';

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
  eventLogs$: Observable<any[]> | undefined;
  active = 'detail';
  isSending = false;

  protected readonly Type = Type;
  protected readonly State = State;
  protected participationService = inject(ParticipationService);

  ngOnInit(): void {
    this.loadInvoices();
    this.loadEventLogs();
  }

  previousState(): void {
    window.history.back();
  }

  generate(): void {
    this.participationService.generateInvoices(this.participation()!.id).subscribe(() => {
      this.loadInvoices();
    });
  }

  hasDiffCustomAndDefault(invoice: IInvoice): boolean {
    return Number(invoice.customAmount ?? 0) !== Number(invoice.defaultAmount ?? 0);
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

  remainingTotal(invoicingPlan: IInvoicingPlan): number {
    return this.totalInvoices(invoicingPlan.invoices ?? []) + this.totalPayments(invoicingPlan.payments ?? []);
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

          invoicingPlansList.forEach(ipl => {
            ipl.payments?.forEach(payment => {
              payment.readMode = true;
            });
          });
          return of(invoicingPlansList);
        } else {
          return EMPTY;
        }
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

  readActionInvoice(invoicingPlan: IInvoicingPlan, invoice: IInvoice): void {
    invoice.readMode = true;
    this.participationService.updateInvoice(invoicingPlan.id, invoice).subscribe(invoiceBack => {
      if (invoiceBack.body) {
        invoice.customAmount = invoiceBack.body.customAmount;
        invoice.extraInformation = invoiceBack.body.extraInformation;
        invoice.lock = invoiceBack.body.lock;
        this.loadEventLogs();
      }
    });
  }

  editActionInvoice(invoice: IInvoice): void {
    invoice.readMode = false;
  }

  mustBeReadMode(invoice: IInvoice, invoicingPlan: IInvoicingPlan): boolean {
    return !!invoice.readMode || invoicingPlan.state === State.CLOSED || !!this.participation()?.isBillingClosed;
  }

  mustDisableSendButton(invoicingPlan: IInvoicingPlan): boolean {
    return this.isSending || !invoicingPlan.invoices?.every((inv: IInvoice) => inv.readMode);
  }
}
