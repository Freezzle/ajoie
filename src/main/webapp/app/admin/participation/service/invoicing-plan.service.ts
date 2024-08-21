import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {IInvoice, IPayment} from '../participation.model';

@Injectable({providedIn: 'root'})
export class InvoicingPlanService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/invoicing-plans');

    createInvoice(idInvoicingPlan: string, invoice: IInvoice): Observable<HttpResponse<IInvoice>> {
        return this.http.post<IInvoice>(
            this.applicationConfigService.getEndpointFor(`${this.resourceUrl}/${idInvoicingPlan}/invoices`),
            invoice,
            {
                observe: 'response',
            },
        );
    }

    updateInvoice(idInvoicingPlan: string, invoice: IInvoice): Observable<HttpResponse<IInvoice>> {
        return this.http.put<IInvoice>(
            this.applicationConfigService.getEndpointFor(
                `${this.resourceUrl}/${idInvoicingPlan}/invoices/${invoice.id}`),
            invoice,
            {
                observe: 'response',
            },
        );
    }

    createPayment(idInvoicingPlan: string, payment: IPayment): Observable<HttpResponse<IPayment>> {
        return this.http.post<IInvoice>(
            this.applicationConfigService.getEndpointFor(`${this.resourceUrl}/${idInvoicingPlan}/payments`),
            payment,
            {
                observe: 'response',
            },
        );
    }

    deletePayment(idInvoicingPlan: string, idPayment: string): Observable<HttpResponse<void>> {
        return this.http.delete<void>(
            this.applicationConfigService.getEndpointFor(
                `${this.resourceUrl}/${idInvoicingPlan}/payments/${idPayment}`),
            {observe: 'response',},
        );
    }

    updatePayment(idInvoicingPlan: string, payment: IPayment): Observable<HttpResponse<IPayment>> {
        return this.http.put<IInvoice>(
            this.applicationConfigService.getEndpointFor(
                `${this.resourceUrl}/${idInvoicingPlan}/payments/${payment.id}`),
            payment,
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
