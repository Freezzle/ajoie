import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';

import {isPresent} from 'app/core/util/operators';
import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {createRequestOption} from 'app/core/request/request-util';
import {IExhibitor, NewExhibitor} from '../exhibitor.model';

export type PartialUpdateExhibitor = Partial<IExhibitor> & Pick<IExhibitor, 'id'>;

export type EntityResponseType = HttpResponse<IExhibitor>;
export type EntityArrayResponseType = HttpResponse<IExhibitor[]>;

@Injectable({providedIn: 'root'})
export class ExhibitorService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/exhibitors');

    create(exhibitor: NewExhibitor): Observable<EntityResponseType> {
        return this.http.post<IExhibitor>(this.resourceUrl, exhibitor, {observe: 'response'});
    }

    update(exhibitor: IExhibitor): Observable<EntityResponseType> {
        return this.http.put<IExhibitor>(`${this.resourceUrl}/${this.getExhibitorIdentifier(exhibitor)}`, exhibitor,
                                         {observe: 'response'});
    }

    partialUpdate(exhibitor: PartialUpdateExhibitor): Observable<EntityResponseType> {
        return this.http.patch<IExhibitor>(`${this.resourceUrl}/${this.getExhibitorIdentifier(exhibitor)}`, exhibitor,
                                           {observe: 'response'});
    }

    find(idExhibitor: string): Observable<EntityResponseType> {
        return this.http.get<IExhibitor>(`${this.resourceUrl}/${idExhibitor}`, {observe: 'response'});
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);
        return this.http.get<IExhibitor[]>(this.resourceUrl, {params: options, observe: 'response'});
    }

    delete(idExhibitor: string): Observable<HttpResponse<{}>> {
        return this.http.delete(`${this.resourceUrl}/${idExhibitor}`, {observe: 'response'});
    }

    getExhibitorIdentifier(exhibitor: Pick<IExhibitor, 'id'>): string {
        return exhibitor.id;
    }

    compareExhibitor(o1: Pick<IExhibitor, 'id'> | null, o2: Pick<IExhibitor, 'id'> | null): boolean {
        return o1 && o2 ? this.getExhibitorIdentifier(o1) === this.getExhibitorIdentifier(o2) : o1 === o2;
    }

    addExhibitorToCollectionIfMissing<Type extends Pick<IExhibitor, 'id'>>(
        exhibitorCollection: Type[],
        ...exhibitorsToCheck: (Type | null | undefined)[]
    ): Type[] {
        const exhibitors: Type[] = exhibitorsToCheck.filter(isPresent);
        if (exhibitors.length > 0) {
            const exhibitorCollectionIdentifiers = exhibitorCollection.map(
                exhibitorItem => this.getExhibitorIdentifier(exhibitorItem));
            const exhibitorsToAdd = exhibitors.filter(exhibitorItem => {
                const exhibitorIdentifier = this.getExhibitorIdentifier(exhibitorItem);
                if (exhibitorCollectionIdentifiers.includes(exhibitorIdentifier)) {
                    return false;
                }
                exhibitorCollectionIdentifiers.push(exhibitorIdentifier);
                return true;
            });
            return [...exhibitorsToAdd, ...exhibitorCollection];
        }
        return exhibitorCollection;
    }
}
