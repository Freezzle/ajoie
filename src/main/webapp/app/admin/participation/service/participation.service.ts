import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {map, Observable} from 'rxjs';

import dayjs from 'dayjs/esm';

import {isPresent} from 'app/core/util/operators';
import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {IInvoicingPlan, IParticipation, NewParticipation} from '../participation.model';

export type PartialUpdateParticipation = Partial<IParticipation> & Pick<IParticipation, 'id'>;

type RestOf<T extends IParticipation | NewParticipation> = Omit<T, 'registrationDate'> & {
    registrationDate?: string | null;
};

export type RestParticipation = RestOf<IParticipation>;

export type EntityResponseType = HttpResponse<IParticipation>;
export type EntityArrayResponseType = HttpResponse<IParticipation[]>;

export type InvoiceArrayResponseType = HttpResponse<IInvoicingPlan[]>;
export type RestInvoice = RestOf<IInvoicingPlan>;

@Injectable({providedIn: 'root'})
export class ParticipationService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/participations');
    protected salonResourceUrl = this.applicationConfigService.getEndpointFor('api/salons');

    create(participation: NewParticipation): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(participation);
        return this.http
                   .post<RestParticipation>(this.resourceUrl, copy, {observe: 'response'})
                   .pipe(map(res => this.convertResponseFromServer(res)));
    }

    update(participation: IParticipation): Observable<EntityResponseType> {
        const copy = this.convertDateFromClient(participation);
        return this.http
                   .put<RestParticipation>(`${this.resourceUrl}/${this.getParticipationIdentifier(participation)}`,
                                           copy, {observe: 'response'})
                   .pipe(map(res => this.convertResponseFromServer(res)));
    }

    find(idParticipation: string): Observable<EntityResponseType> {
        return this.http
                   .get<RestParticipation>(`${this.resourceUrl}/${idParticipation}`, {observe: 'response'})
                   .pipe(map(res => this.convertResponseFromServer(res)));
    }

    query(idSalon: string): Observable<EntityArrayResponseType> {
        return this.http
                   .get<RestParticipation[]>(`${this.salonResourceUrl}/${idSalon}/participations`,
                                             {observe: 'response'})
                   .pipe(map(res => this.convertResponseArrayFromServer(res)));
    }

    delete(idParticipation: string): Observable<HttpResponse<{}>> {
        return this.http.delete(`${this.resourceUrl}/${idParticipation}`, {observe: 'response'});
    }

    getInvoicingPlans(idParticipation: string): Observable<InvoiceArrayResponseType> {
        return this.http.get<RestInvoice[]>(`${this.resourceUrl}/${idParticipation}/invoicing-plans`, {
            observe: 'response',
        });
    }

    generateInvoices(idParticipation: string): Observable<HttpResponse<{}>> {
        return this.http.patch(`${this.resourceUrl}/${idParticipation}/refresh-invoicing-plans`, {},
                               {observe: 'response'});
    }

    getEventLogs(idParticipation: string): Observable<HttpResponse<any>> {
        return this.http.get<any[]>(`${this.resourceUrl}/${idParticipation}/events`, {observe: 'response'});
    }

    getParticipationIdentifier(participation: Pick<IParticipation, 'id'>): string {
        return participation.id;
    }

    compareParticipation(o1: Pick<IParticipation, 'id'> | null, o2: Pick<IParticipation, 'id'> | null): boolean {
        return o1 && o2 ? this.getParticipationIdentifier(o1) === this.getParticipationIdentifier(o2) : o1 === o2;
    }

    addParticipationToCollectionIfMissing<Type extends Pick<IParticipation, 'id'>>(
        participationCollection: Type[],
        ...participationsToCheck: (Type | null | undefined)[]
    ): Type[] {
        const participations: Type[] = participationsToCheck.filter(isPresent);
        if (participations.length > 0) {
            const participationCollectionIdentifiers = participationCollection.map(participationItem =>
                                                                                       this.getParticipationIdentifier(
                                                                                           participationItem),
            );
            const participationsToAdd = participations.filter(participationItem => {
                const participationIdentifier = this.getParticipationIdentifier(participationItem);
                if (participationCollectionIdentifiers.includes(participationIdentifier)) {
                    return false;
                }
                participationCollectionIdentifiers.push(participationIdentifier);
                return true;
            });
            return [...participationsToAdd, ...participationCollection];
        }
        return participationCollection;
    }

    protected convertDateFromClient<T extends IParticipation | NewParticipation | PartialUpdateParticipation>(participation: T): RestOf<T> {
        return {
            ...participation,
            registrationDate: participation.registrationDate?.toJSON() ?? null,
        };
    }

    protected convertDateFromServer(restParticipation: RestParticipation): IParticipation {
        return {
            ...restParticipation,
            registrationDate: restParticipation.registrationDate ? dayjs(
                restParticipation.registrationDate) : undefined,
        };
    }

    protected convertResponseFromServer(res: HttpResponse<RestParticipation>): HttpResponse<IParticipation> {
        return res.clone({
                             body: res.body ? this.convertDateFromServer(res.body) : null,
                         });
    }

    protected convertResponseArrayFromServer(res: HttpResponse<RestParticipation[]>): HttpResponse<IParticipation[]> {
        return res.clone({
                             body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
                         });
    }
}
