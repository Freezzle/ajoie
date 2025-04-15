import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { IInvoice, IPayment } from '../model/invoicing-plan.interface';

@Injectable({ providedIn: 'root' })
export class InvoicingPlanService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/invoicing-plans');

  createInvoice(idInvoicingPlan: string, invoice: IInvoice): Observable<HttpResponse<IInvoice>> {
    return this.http.post<IInvoice>(`${this.resourceUrl}/${idInvoicingPlan}/invoices`, invoice,
      { observe: 'response' });
  }

  updateInvoice(idInvoicingPlan: string, invoice: IInvoice): Observable<HttpResponse<IInvoice>> {
    return this.http.put<IInvoice>(`${this.resourceUrl}/${idInvoicingPlan}/invoices/${invoice.id}`, invoice,
      { observe: 'response' });
  }

  createPayment(idInvoicingPlan: string, payment: IPayment): Observable<HttpResponse<IPayment>> {
    return this.http.post<IPayment>(`${this.resourceUrl}/${idInvoicingPlan}/payments`, payment,
      { observe: 'response' });
  }

  updatePayment(idInvoicingPlan: string, payment: IPayment): Observable<HttpResponse<IPayment>> {
    return this.http.put<IPayment>(`${this.resourceUrl}/${idInvoicingPlan}/payments/${payment.id}`, payment,
      { observe: 'response' });
  }


  switchArrangement(idInvoicingPlan: string): Observable<{}> {
    return this.http.put<{}>(`${this.resourceUrl}/${idInvoicingPlan}/switch-arrangement`, {});
  }

  deletePayment(idInvoicingPlan: string, idPayment: string): Observable<HttpResponse<void>> {
    return this.http.delete<void>(`${this.resourceUrl}/${idInvoicingPlan}/payments/${idPayment}`,
      { observe: 'response' });
  }

  splitInvoicingPlan(idInvoicingPlan: string, invoicesIdsToMove: (string | null)[]): Observable<HttpResponse<{}>> {

    return this.http.post<{}>(`${this.resourceUrl}/${idInvoicingPlan}/split-invoices`,
      { invoicesIds: invoicesIdsToMove },
      { observe: 'response' });
  }
}
