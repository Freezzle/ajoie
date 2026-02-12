import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {map, Observable} from 'rxjs';

import dayjs from 'dayjs/esm';
import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {getFormattedParticipationName, IInfoInvoice, IParticipation} from '../model/participation.interface';
import {removeAccents} from '../../../shared/utils/string.util';
import {IInvoicingPlan} from '../model/invoicing-plan.interface';

@Injectable({providedIn: 'root'})
export class ParticipationService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/participations');
    protected salonResourceUrl = this.applicationConfigService.getEndpointFor('api/admin/salons');

    create(participation: IParticipation): Observable<HttpResponse<IParticipation>> {
        const copy = this.convertDateFromClient(participation);
        return this.http
                   .post<IParticipation>(this.resourceUrl, copy, {observe: 'response'})
                   .pipe(map(res => this.convertResponseFromServer(res)));
    }

    update(participation: IParticipation): Observable<HttpResponse<IParticipation>> {
        const copy = this.convertDateFromClient(participation);
        return this.http
                   .put<IParticipation>(`${this.resourceUrl}/${getParticipationIdentifier(participation)}`, copy,
                                        {observe: 'response'})
                   .pipe(map(res => this.convertResponseFromServer(res)));
    }

    find(idParticipation: string): Observable<HttpResponse<IParticipation>> {
        return this.http
                   .get<IParticipation>(`${this.resourceUrl}/${idParticipation}`, {observe: 'response'})
                   .pipe(map(res => this.convertResponseFromServer(res)));
    }

    query(idSalon: string): Observable<HttpResponse<IParticipation[]>> {
        return this.http
                   .get<IParticipation[]>(`${this.salonResourceUrl}/${idSalon}/participations`, {observe: 'response'})
                   .pipe(map(res => this.convertResponseArrayFromServer(res)));
    }

    delete(idParticipation: string): Observable<HttpResponse<unknown>> {
        return this.http.delete(`${this.resourceUrl}/${idParticipation}`, {observe: 'response'});
    }

    getInfosInvoiceForSalon(idSalon: string): Observable<{ [id: string]: IInfoInvoice }> {
        return this.http.get<{
            [id: string]: IInfoInvoice
        }>(`${this.salonResourceUrl}/${idSalon}/participations/info-invoices`
        );
    }

    getInvoicingPlans(idParticipation: string): Observable<HttpResponse<IInvoicingPlan[]>> {
        return this.http.get<IInvoicingPlan[]>(`${this.resourceUrl}/${idParticipation}/invoicing-plans`, {
            observe: 'response'
        });
    }

    generateInvoices(idParticipation: string): Observable<HttpResponse<unknown>> {
        return this.http.patch(`${this.resourceUrl}/${idParticipation}/refresh-invoicing-plans`, {},
                               {observe: 'response'});
    }

    getEventLogs(idParticipation: string): Observable<HttpResponse<any>> {
        return this.http.get<any[]>(`${this.resourceUrl}/${idParticipation}/events`, {observe: 'response'});
    }

    getExhibitorEmailsWithActiveParticipations(): Observable<string[]> {
        return this.http.get<string[]>(`${this.resourceUrl}/active-exhibitor-emails`);
    }

    protected convertDateFromClient<T extends IParticipation>(participation: T): T {
        return {
            ...participation,
            registrationDate: dayjs(participation.registrationDate)?.toJSON() ?? null
        };
    }

    protected convertResponseFromServer(res: HttpResponse<IParticipation>): HttpResponse<IParticipation> {
        return res.clone({
                             body: res.body ? this.convertDateFromServer(res.body) : null
                         });
    }

    protected convertResponseArrayFromServer(res: HttpResponse<IParticipation[]>): HttpResponse<IParticipation[]> {
        return res.clone({
                             body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null
                         });
    }

    protected convertDateFromServer(restParticipation: IParticipation): IParticipation {
        return {
            ...restParticipation,
            registrationDate: restParticipation.registrationDate ? dayjs(restParticipation.registrationDate).toDate() :
                              null
        };
    }
}

export function getParticipationIdentifier(participation: Pick<IParticipation, 'id'>): string {
    return participation.id;
}

export function compareParticipation(o1: Pick<IParticipation, 'id'> | null,
                                     o2: Pick<IParticipation, 'id'> | null): boolean {
    return o1 && o2 ? getParticipationIdentifier(o1) === getParticipationIdentifier(o2) : o1 === o2;
}

export function formatterParticipation(participation: IParticipation): string {
    return removeAccents(getFormattedParticipationName(participation));
}
