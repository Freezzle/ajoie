import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';

import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {createRequestOption} from 'app/core/request/request-util';
import {IStand} from '../model/stand.interface';

export type StandPictureType = 'MAIN' | 'SHARED';

@Injectable({providedIn: 'root'})
export class StandService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/stands');

    create(stand: IStand): Observable<IStand> {
        return this.http.post<IStand>(this.resourceUrl, stand);
    }

    update(stand: IStand): Observable<IStand> {
        return this.http.put<IStand>(`${this.resourceUrl}/${this.getStandIdentifier(stand)}`, stand);
    }

    find(idStand: string): Observable<HttpResponse<IStand>> {
        return this.http.get<IStand>(`${this.resourceUrl}/${idStand}`, {observe: 'response'});
    }

    query(req?: any): Observable<IStand[]> {
        const options = createRequestOption(req);
        return this.http.get<IStand[]>(this.resourceUrl, {params: options});
    }

    delete(idStand: string): Observable<unknown> {
        return this.http.delete(`${this.resourceUrl}/${idStand}`);
    }

    /**
     * URL de l'image d'un stand, directement utilisable dans une balise `img` (session cookie).
     */
    pictureUrl(idStand: string, type: StandPictureType): string {
        return `${this.resourceUrl}/${idStand}/pictures/${type}`;
    }

    downloadPicture(idStand: string, type: StandPictureType, asAttachment = false): Observable<Blob> {
        return this.http.get(this.pictureUrl(idStand, type), {
            params: asAttachment ? {download: 'true'} : {},
            responseType: 'blob'
        });
    }

    getStandIdentifier(stand: Pick<IStand, 'id'>): string {
        return stand.id;
    }
}
