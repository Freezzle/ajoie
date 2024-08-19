import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { IInvoice } from '../participation.model';

@Injectable({ providedIn: 'root' })
export class InvoicingPlanService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/invoicing-plans');

  updateInvoice(idInvoicingPlan: string, invoice: IInvoice): Observable<HttpResponse<IInvoice>> {
    return this.http.put<IInvoice>(
      this.applicationConfigService.getEndpointFor(`${this.resourceUrl}/${idInvoicingPlan}/invoices/${invoice.id}`),
      invoice,
      {
        observe: 'response',
      },
    );
  }

  sendInvoicingPlan(idInvoicingPlan: string): Observable<HttpResponse<{}>> {
    return this.http.patch(
      this.applicationConfigService.getEndpointFor(`${this.resourceUrl}/${idInvoicingPlan}/send`),
      {},
      {
        observe: 'response',
      },
    );
  }
}
