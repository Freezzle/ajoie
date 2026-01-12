import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {createRequestOption} from 'app/core/request/request-util';
import {IWorkshop} from '../model/workshop.interface';

@Injectable({providedIn: 'root'})
export class WorkshopService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/workshops');

    create(workshop: IWorkshop): Observable<IWorkshop> {
        return this.http.post<IWorkshop>(this.resourceUrl, workshop);
    }

    update(workshop: IWorkshop): Observable<IWorkshop> {
        return this.http.put<IWorkshop>(`${this.resourceUrl}/${this.getWorkshopIdentifier(workshop)}`, workshop);
    }

    find(idWorkshop: string): Observable<HttpResponse<IWorkshop>> {
        return this.http.get<IWorkshop>(`${this.resourceUrl}/${idWorkshop}`, {
            observe: 'response'
        });
    }

    query(req?: any): Observable<IWorkshop[]> {
        const options = createRequestOption(req);
        return this.http.get<IWorkshop[]>(this.resourceUrl, {params: options});
    }

    delete(idWorkshop: string): Observable<unknown> {
        return this.http.delete(`${this.resourceUrl}/${idWorkshop}`);
    }

    getWorkshopIdentifier(workshop: Pick<IWorkshop, 'id'>): string {
        return workshop.id;
    }
}
