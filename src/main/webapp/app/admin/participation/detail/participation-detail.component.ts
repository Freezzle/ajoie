import { Component, inject, input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { IParticipation } from '../participation.model';
import { ParticipationService } from '../service/participation.service';
import { IInvoice } from '../../../entities/invoice/invoice.model';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { ISalonStats } from '../../salon/salon.model';
import { InvoiceService } from '../../../entities/invoice/service/invoice.service';
import { LANGUAGES } from '../../../config/language.constants';
import { FormsModule } from '@angular/forms';
import FaIconBooleanPipe from '../../../shared/pipe/fa-icon-boolean.pipe';
import FaIconColorBooleanPipe from '../../../shared/pipe/fa-icon-color-boolean.pipe';

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
    FaIconBooleanPipe,
    FaIconColorBooleanPipe,
  ],
})
export class ParticipationDetailComponent implements OnInit {
  participation = input<IParticipation | null>(null);

  invoices$: Observable<IInvoice[]> | undefined;

  protected participationService = inject(ParticipationService);

  protected invoiceService = inject(InvoiceService);

  ngOnInit(): void {
    this.loadInvoices();
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
    this.invoiceService.delete(invoice.id).subscribe(() => {
      this.loadInvoices();
    });
  }

  totalDefault(invoices: IInvoice[]): number {
    return (
      invoices
        .map(invoice => invoice.defaultAmount)
        .reduce((previousValue, defaultAmount) => 0 + (previousValue ?? 0) + (defaultAmount ?? 0)) ?? 0
    );
  }

  totalCustom(invoices: IInvoice[]): number {
    return (
      invoices
        .map(invoice => invoice.customAmount)
        .reduce((previousValue, defaultAmount) => 0 + (previousValue ?? 0) + (defaultAmount ?? 0)) ?? 0
    );
  }

  total(invoices: IInvoice[]): number {
    return (
      invoices.map(invoice => invoice.total).reduce((previousValue, defaultAmount) => 0 + (previousValue ?? 0) + (defaultAmount ?? 0)) ?? 0
    );
  }

  loadInvoices(): void {
    this.invoices$ = this.participationService.getInvoices(this.participation()!.id).pipe(
      mergeMap((invoices: HttpResponse<IInvoice[]>) => {
        if (invoices.body) {
          return of(invoices.body);
        }
        return EMPTY;
      }),
    );
  }
}
