import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {createRequestOption} from 'app/core/request/request-util';
import {IAuthority, NewAuthority} from '../authority.model';

export type EntityResponseType = HttpResponse<IAuthority>;
export type EntityArrayResponseType = HttpResponse<IAuthority[]>;

@Injectable({providedIn: 'root'})
export class AuthorityService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);

    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/authorities');

    create(authority: NewAuthority): Observable<EntityResponseType> {
        return this.http.post<IAuthority>(this.resourceUrl, authority, {observe: 'response'});
    }

    find(idAuthority: string): Observable<EntityResponseType> {
        return this.http.get<IAuthority>(`${this.resourceUrl}/${idAuthority}`, {observe: 'response'});
    }

    query(req?: any): Observable<EntityArrayResponseType> {
        const options = createRequestOption(req);
        return this.http.get<IAuthority[]>(this.resourceUrl, {params: options, observe: 'response'});
    }

    delete(idAuthority: string): Observable<HttpResponse<unknown>> {
        return this.http.delete(`${this.resourceUrl}/${idAuthority}`, {observe: 'response'});
    }

    getAuthorityIdentifier(authority: Pick<IAuthority, 'name'>): string {
        return authority.name;
    }
}
