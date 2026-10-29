import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {
    IPublicVolunteerSalonInfo,
    IVolunteerCaptchaConfig,
    IVolunteerRegistration,
    IVolunteerRegistrationRequest,
    IVolunteerRegistrationResponse
} from './volunteer-registration.model';

/**
 * Appels HTTP du parcours public d'inscription bénévole.
 */
@Injectable({providedIn: 'root'})
export class VolunteerRegistrationService {
    private readonly http = inject(HttpClient);
    private readonly applicationConfigService = inject(ApplicationConfigService);
    private readonly resourceUrl = this.applicationConfigService.getEndpointFor('api/public/volunteer-registrations');

    getCaptchaConfig(): Observable<IVolunteerCaptchaConfig> {
        return this.http.get<IVolunteerCaptchaConfig>(`${this.resourceUrl}/captcha-config`);
    }

    getSalonInfo(salonId: string): Observable<IPublicVolunteerSalonInfo> {
        return this.http.get<IPublicVolunteerSalonInfo>(`${this.resourceUrl}/salons/${salonId}`);
    }

    register(salonId: string, request: IVolunteerRegistrationRequest): Observable<IVolunteerRegistrationResponse> {
        return this.http.post<IVolunteerRegistrationResponse>(`${this.resourceUrl}/salons/${salonId}`, request);
    }

    findRegistration(salonId: string, registrationId: string, token: string): Observable<IVolunteerRegistration> {
        return this.http.get<IVolunteerRegistration>(
            `${this.resourceUrl}/salons/${salonId}/${registrationId}/${token}`);
    }

    updateRegistration(salonId: string, registrationId: string, token: string,
                       request: IVolunteerRegistrationRequest): Observable<IVolunteerRegistrationResponse> {
        return this.http.put<IVolunteerRegistrationResponse>(
            `${this.resourceUrl}/salons/${salonId}/${registrationId}/${token}`, request);
    }

    cancel(salonId: string, registrationId: string, token: string): Observable<void> {
        return this.http.delete<void>(`${this.resourceUrl}/salons/${salonId}/${registrationId}/${token}`);
    }

    resendLink(salonId: string, email: string): Observable<void> {
        return this.http.post<void>(`${this.resourceUrl}/salons/${salonId}/resend-link`, {email});
    }
}
