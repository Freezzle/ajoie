import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {IInvoice, IInvoicingPlanList, IPayment} from '../model/invoicing-plan.interface';
import {InvoiceSendingMethod} from '../../enumerations/invoice-sending-method.model';

@Injectable({providedIn: 'root'})
export class InvoicingPlanService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/invoicing-plans');
    protected salonResourceUrl = this.applicationConfigService.getEndpointFor('api/admin/salons');

    queryBySalon(idSalon: string): Observable<HttpResponse<IInvoicingPlanList[]>> {
        return this.http.get<IInvoicingPlanList[]>(`${this.salonResourceUrl}/${idSalon}/invoicing-plans`,
                                                    {observe: 'response'});
    }

    createInvoice(idInvoicingPlan: string, invoice: IInvoice): Observable<HttpResponse<IInvoice>> {
        return this.http.post<IInvoice>(`${this.resourceUrl}/${idInvoicingPlan}/invoices`, invoice,
                                        {observe: 'response'});
    }

    updateInvoice(idInvoicingPlan: string, invoice: IInvoice): Observable<HttpResponse<IInvoice>> {
        return this.http.put<IInvoice>(`${this.resourceUrl}/${idInvoicingPlan}/invoices/${invoice.id}`, invoice,
                                       {observe: 'response'});
    }

    createPayment(idInvoicingPlan: string, payment: IPayment): Observable<HttpResponse<IPayment>> {
        return this.http.post<IPayment>(`${this.resourceUrl}/${idInvoicingPlan}/payments`, payment,
                                        {observe: 'response'});
    }

    updatePayment(idInvoicingPlan: string, payment: IPayment): Observable<HttpResponse<IPayment>> {
        return this.http.put<IPayment>(`${this.resourceUrl}/${idInvoicingPlan}/payments/${payment.id}`, payment,
                                       {observe: 'response'});
    }

    switchArrangement(idInvoicingPlan: string): Observable<unknown> {
        return this.http.put<unknown>(`${this.resourceUrl}/${idInvoicingPlan}/switch-arrangement`, {});
    }

    switchInvoiceSendingMethod(idInvoicingPlan: string, method: InvoiceSendingMethod): Observable<unknown> {
        return this.http.put<unknown>(`${this.resourceUrl}/${idInvoicingPlan}/switch-invoice-method/${method}`, {});
    }

    deleteInvoice(idInvoicingPlan: string, idInvoice: string): Observable<HttpResponse<void>> {
        return this.http.delete<void>(`${this.resourceUrl}/${idInvoicingPlan}/invoices/${idInvoice}`,
                                      {observe: 'response'});
    }

    deletePayment(idInvoicingPlan: string, idPayment: string): Observable<HttpResponse<void>> {
        return this.http.delete<void>(`${this.resourceUrl}/${idInvoicingPlan}/payments/${idPayment}`,
                                      {observe: 'response'});
    }

    getEventLogs(idInvoicingPlan: string): Observable<HttpResponse<unknown[]>> {
        return this.http.get<unknown[]>(`${this.resourceUrl}/${idInvoicingPlan}/events`, {observe: 'response'});
    }

    splitInvoicingPlan(idInvoicingPlan: string, invoicesIdsToMove: (string | null)[]): Observable<HttpResponse<unknown>> {

        return this.http.post<unknown>(`${this.resourceUrl}/${idInvoicingPlan}/split-invoices`,
                                       {invoicesIds: invoicesIdsToMove},
                                       {observe: 'response'});
    }
}
