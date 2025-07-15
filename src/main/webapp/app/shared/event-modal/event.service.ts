import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ApplicationConfigService} from '../../core/config/application-config.service';
import {Observable} from 'rxjs';

@Injectable({providedIn: 'root'})
export class EventService {

    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/events');

    deleteEvent(idEvent: string): Observable<{}> {
        return this.http.delete(`${this.resourceUrl}/${idEvent}`);
    }
}
