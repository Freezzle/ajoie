import {Observable} from 'rxjs';
import {AvailableAction} from '../../shared/model/available-action';
import {EmailMessage} from '../../shared/email-dialog/email-message';
import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ApplicationConfigService} from '../../core/config/application-config.service';

@Injectable({providedIn: 'root'})
export class ActionsService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected resourceActionsUrl = this.applicationConfigService.getEndpointFor('api/actions');

    getAvailableActions(domain: string, idEntity: string): Observable<AvailableAction[]> {
        return this.http.get<AvailableAction[]>(
            `${this.resourceActionsUrl}/${domain}/${idEntity}/available`);
    }

    templateEmailAction(context: string, idEntity: string): Observable<EmailMessage> {
        return this.http.get<EmailMessage>(`${this.resourceActionsUrl}/email/${context}/${idEntity}/template`);
    }

    businessAction(context: string, idEntity: string): Observable<{}> {
        return this.http.post<{}>(`${this.resourceActionsUrl}/business/${context}/${idEntity}`, {});
    }

    emailAction(context: string, idEntity: string, emailMessage: EmailMessage) {
        const payload: { [key: string]: any } = {
            'emailMessage': emailMessage,
        };

        return this.http.post<{}>(`${this.resourceActionsUrl}/email/${context}/${idEntity}`, payload);
    }

    downloadAction(context: string, idEntity: string): Observable<Blob> {
        return this.http.get(`${this.resourceActionsUrl}/download/${context}/${idEntity}`, {responseType: 'blob'});
    }
}
