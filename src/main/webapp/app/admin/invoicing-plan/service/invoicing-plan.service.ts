import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import dayjs from 'dayjs/esm';
import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {IInvoice, IInvoicingPlan, IInvoicingPlanList, IPayment} from '../model/invoicing-plan.interface';

@Injectable({providedIn: 'root'})
export class InvoicingPlanService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/invoicing-plans');
    protected salonResourceUrl = this.applicationConfigService.getEndpointFor('api/admin/salons');

    queryBySalon(idSalon: string): Observable<IInvoicingPlanList[]> {
        return this.http.get<IInvoicingPlanList[]>(`${this.salonResourceUrl}/${idSalon}/invoicing-plans`)
                   .pipe(map(plans => (plans ?? []).map(plan => this.convertListDatesFromServer(plan))));
    }

    find(idInvoicingPlan: string): Observable<IInvoicingPlan> {
        return this.http.get<IInvoicingPlan>(`${this.resourceUrl}/${idInvoicingPlan}`)
                   .pipe(map(plan => this.convertDatesFromServer(plan)));
    }

    /** Ligne de liste d'une seule facture, pour rafraîchir une ligne sans recharger le salon. */
    findSummary(idInvoicingPlan: string): Observable<IInvoicingPlanList> {
        return this.http.get<IInvoicingPlanList>(`${this.resourceUrl}/${idInvoicingPlan}/summary`)
                   .pipe(map(plan => this.convertListDatesFromServer(plan)));
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

    /** Le serveur renvoie des dates ISO : la liste a besoin de vraies dates pour calculer l'urgence. */
    private convertListDatesFromServer(plan: IInvoicingPlanList): IInvoicingPlanList {
        return {
            ...plan,
            generationDate: toDayjs(plan.generationDate),
            issuedDate: toDayjs(plan.issuedDate),
            expirationDate: toDayjs(plan.expirationDate),
            lastPaymentDate: toDayjs(plan.lastPaymentDate),
            reminders: (plan.reminders ?? []).map(reminder => ({
                sentDate: toDayjs(reminder.sentDate),
                dueDateAtSend: toDayjs(reminder.dueDateAtSend)
            }))
        };
    }

    private convertDatesFromServer(plan: IInvoicingPlan): IInvoicingPlan {
        return {
            ...plan,
            generationDate: toDayjs(plan.generationDate),
            issuedDate: toDayjs(plan.issuedDate),
            expirationDate: toDayjs(plan.expirationDate),
            invoices: (plan.invoices ?? []).map(invoice => ({
                ...invoice,
                generationDate: toDayjs(invoice.generationDate)
            })),
            payments: (plan.payments ?? []).map(payment => ({
                ...payment,
                billingDate: toDayjs(payment.billingDate)
            }))
        };
    }
}

function toDayjs(value: dayjs.Dayjs | null | undefined): dayjs.Dayjs | null {
    return value ? dayjs(value) : null;
}
