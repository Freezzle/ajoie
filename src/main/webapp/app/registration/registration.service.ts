import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {
    ICaptchaConfig,
    IPublicSalonInfo,
    IRegistrationRequest,
    IRegistrationResponse
} from './registration.model';

@Injectable({providedIn: 'root'})
export class RegistrationService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/public/registrations');

    getCaptchaConfig(): Observable<ICaptchaConfig> {
        return this.http.get<ICaptchaConfig>(`${this.resourceUrl}/captcha-config`);
    }

    getSalonInfo(salonId: string): Observable<IPublicSalonInfo> {
        return this.http.get<IPublicSalonInfo>(`${this.resourceUrl}/salons/${salonId}`);
    }

    register(salonId: string, request: IRegistrationRequest): Observable<IRegistrationResponse> {
        return this.http.post<IRegistrationResponse>(`${this.resourceUrl}/salons/${salonId}`, request);
    }

    findRegistration(salonId: string, participationId: string, token: string): Observable<IRegistrationRequest> {
        return this.http.get<IRegistrationRequest>(
            `${this.resourceUrl}/salons/${salonId}/${participationId}/${encodeURIComponent(token)}`);
    }

    updateRegistration(salonId: string, participationId: string, token: string,
                       request: IRegistrationRequest): Observable<IRegistrationResponse> {
        return this.http.put<IRegistrationResponse>(
            `${this.resourceUrl}/salons/${salonId}/${participationId}/${encodeURIComponent(token)}`, request);
    }
}
