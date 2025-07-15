import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';

import {isPresent} from 'app/core/util/operators';
import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {createRequestOption} from 'app/core/request/request-util';
import {getFirstExhibitorName, IExhibitor} from '../model/exhibitor.interface';
import {IParticipation} from '../../participation/model/participation.interface';
import {removeAccents} from '../../../shared/utils/string.util';

@Injectable({providedIn: 'root'})
export class ExhibitorService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/exhibitors');

    create(exhibitor: IExhibitor): Observable<IExhibitor> {
        return this.http.post<IExhibitor>(this.resourceUrl, exhibitor);
    }

    update(exhibitor: IExhibitor): Observable<IExhibitor> {
        return this.http.put<IExhibitor>(`${this.resourceUrl}/${getExhibitorIdentifier(exhibitor)}`, exhibitor);
    }

    find(idExhibitor: string): Observable<HttpResponse<IExhibitor>> {
        return this.http.get<IExhibitor>(`${this.resourceUrl}/${idExhibitor}`, {observe: 'response'});
    }

    findParticipations(idExhibitor: string): Observable<IParticipation[]> {
        return this.http.get<IParticipation[]>(`${this.resourceUrl}/${idExhibitor}/participations`);
    }

    query(req?: any): Observable<HttpResponse<IExhibitor[]>> {
        const options = createRequestOption(req);
        return this.http.get<IExhibitor[]>(this.resourceUrl, {params: options, observe: 'response'});
    }

    delete(idExhibitor: string): Observable<{}> {
        return this.http.delete(`${this.resourceUrl}/${idExhibitor}`);
    }

    addExhibitorOptionsIfMissing<Type extends Pick<IExhibitor, 'id'>>(
        exhibitorCollection: Type[],
        ...exhibitorsToCheck: (Type | null | undefined)[]
    ): Type[] {
        const exhibitors: Type[] = exhibitorsToCheck.filter(isPresent);
        if (exhibitors.length > 0) {
            const exhibitorCollectionIdentifiers = exhibitorCollection.map(
                exhibitorItem => getExhibitorIdentifier(exhibitorItem));
            const exhibitorsToAdd = exhibitors.filter(exhibitorItem => {
                const exhibitorIdentifier = getExhibitorIdentifier(exhibitorItem);
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

export function getExhibitorIdentifier(exhibitor: Pick<IExhibitor, 'id'>): string {
    return exhibitor.id;
}

export function compareExhibitor(o1: Pick<IExhibitor, 'id'> | null, o2: Pick<IExhibitor, 'id'> | null): boolean {
    return o1 && o2 ? getExhibitorIdentifier(o1) === getExhibitorIdentifier(o2) : o1 === o2;
}

export function formatterExhibitor(exhibitor: IExhibitor | null): string {
    return removeAccents(getFirstExhibitorName(exhibitor));
}
