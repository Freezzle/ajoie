import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

import {ApplicationConfigService} from 'app/core/config/application-config.service';

/**
 * Inscription à la liste d'attente de la plateforme (section « La plateforme ouvre bientôt »).
 */
@Injectable({providedIn: 'root'})
export class WaitlistService {
    private readonly http = inject(HttpClient);
    private readonly applicationConfigService = inject(ApplicationConfigService);
    private readonly resourceUrl = this.applicationConfigService.getEndpointFor('api/public/waitlist');

    subscribe(email: string): Observable<void> {
        return this.http.post<void>(this.resourceUrl, {email});
    }
}
