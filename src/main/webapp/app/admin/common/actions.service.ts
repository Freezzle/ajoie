import {Observable} from 'rxjs';
import {AvailableAction} from '../../shared/model/available-action';
import {EmailMessage} from '../../shared/email-dialog/email-message';
import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {ApplicationConfigService} from '../../core/config/application-config.service';

@Injectable({providedIn: 'root'})
export class ActionsService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected resourceActionsUrl = this.applicationConfigService.getEndpointFor('api/actions');

    getAvailableActions(domain: string, idEntity: string, subContext?: string): Observable<AvailableAction[]> {
        let params = new HttpParams();
        if (subContext) {
            params = params.set('subContext', subContext);
        }
        return this.http.get<AvailableAction[]>(
            `${this.resourceActionsUrl}/${domain}/${idEntity}/available`,
            { params });
    }

    templateEmailAction(context: string, idEntity: string): Observable<EmailMessage> {
        return this.http.get<EmailMessage>(`${this.resourceActionsUrl}/email/${context}/${idEntity}/template`);
    }

    businessAction(context: string, idEntity: string, payload?: Map<string, any>): Observable<unknown> {
        const body = payload ? Object.fromEntries(payload) : {};
        return this.http.post<unknown>(`${this.resourceActionsUrl}/business/${context}/${idEntity}`, body);
    }

    emailAction(context: string, idEntity: string, emailMessage: EmailMessage): Observable<unknown> {
        const payload: { [key: string]: any } = {
            emailMessage
        };

        return this.http.post<unknown>(`${this.resourceActionsUrl}/email/${context}/${idEntity}`, payload);
    }

    downloadAction(context: string, idEntity: string): Observable<HttpResponse<Blob>> {
        return this.http.get(`${this.resourceActionsUrl}/download/${context}/${idEntity}`, {
            responseType: 'blob',
            observe: 'response'
        });
    }
}
