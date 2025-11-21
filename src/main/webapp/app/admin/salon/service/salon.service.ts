import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams, HttpResponse} from '@angular/common/http';
import {map, Observable, of} from 'rxjs';

import dayjs from 'dayjs/esm';

import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {createRequestOption} from 'app/core/request/request-util';
import {ISalon, NewSalon} from '../model/salon.interface';
import {Status} from '../../enumerations/status.model';
import {ISalonStats} from '../model/salon-stats.interface';
import {IPriceStandSalon} from "../model/price-stand-salon.interface";
import {IParticipation} from "../../participation/model/participation.interface";
import {PlanningTalksDto} from "../../conference/planning/planning-talks.component";

@Injectable({providedIn: 'root'})
export class SalonService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/salons');

    create(salon: ISalon): Observable<HttpResponse<ISalon>> {
        const copy = this.convertDateFromClient(salon);
        return this.http.post<ISalon>(this.resourceUrl, copy, {observe: 'response'})
            .pipe(map(res => this.convertResponseFromServer(res)));
    }

    update(salon: ISalon): Observable<HttpResponse<ISalon>> {
        const copy = this.convertDateFromClient(salon);
        return this.http
            .put<ISalon>(`${this.resourceUrl}/${this.getSalonIdentifier(salon)}`, copy, {observe: 'response'})
            .pipe(map(res => this.convertResponseFromServer(res)));
    }

    find(idSalon: string): Observable<HttpResponse<ISalon>> {
        return this.http
            .get<ISalon>(`${this.resourceUrl}/${idSalon}`, {observe: 'response'})
            .pipe(map(res => this.convertResponseFromServer(res)));
    }

    stats(idSalon: string, statuses: Status[]): Observable<HttpResponse<ISalonStats>> {
        let params = new HttpParams();
        statuses.forEach(status => {
            params = params.append('statuses', status.toString());
        });

        return this.http.get<ISalonStats>(`${this.resourceUrl}/${idSalon}/stats`, {params, observe: 'response'});
    }

    getPlanningTalks(idSalon: string): Observable<PlanningTalksDto> {
        return this.http.get<PlanningTalksDto>(`${this.resourceUrl}/${idSalon}/planning-talks`);
    }

    savePlanningTalks(idSalon: string, payload: PlanningTalksDto): Observable<void> {
        return this.http.put<void>(`${this.resourceUrl}/${idSalon}/planning-talks`, payload);
    }

    query(req?: any): Observable<HttpResponse<ISalon[]>> {
        const options = createRequestOption(req);
        return this.http
            .get<ISalon[]>(this.resourceUrl, {params: options, observe: 'response'})
            .pipe(map(res => this.convertResponseArrayFromServer(res)));
    }

    generate(idSalon: string, selectedFile: File): Observable<IParticipation[]> {
        const formData = new FormData();
        formData.append('file', selectedFile);
        return this.http.post<IParticipation[]>(`${this.resourceUrl}/${idSalon}/import-inscriptions`, formData);
    }

    delete(idSalon: string): Observable<HttpResponse<unknown>> {
        return this.http.delete(`${this.resourceUrl}/${idSalon}`, {observe: 'response'});
    }

    getSalonIdentifier(salon: Pick<ISalon, 'id'>): string {
        return salon.id;
    }

    getDimensionStands(idSalon: string | null): Observable<IPriceStandSalon[]> {
        if (!idSalon) {
            return of([]);
        }
        return this.http.get<IPriceStandSalon[]>(`${this.resourceUrl}/${idSalon}/dimension-stands`);
    }

    protected convertResponseFromServer(res: HttpResponse<ISalon>): HttpResponse<ISalon> {
        return res.clone({
            body: res.body ? this.convertDateFromServer(res.body) : null,
        });
    }

    protected convertResponseArrayFromServer(res: HttpResponse<ISalon[]>): HttpResponse<ISalon[]> {
        return res.clone({
            body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
        });
    }

    protected convertDateFromClient<T extends ISalon | NewSalon>(salon: T): T {
        return {
            ...salon,
            startingDate: dayjs(salon.startingDate)?.toJSON() ?? null,
            endingDate: dayjs(salon.endingDate)?.toJSON() ?? null,
        };
    }

    protected convertDateFromServer(restSalon: ISalon): ISalon {
        return {
            ...restSalon,
            startingDate: dayjs(restSalon.startingDate).toDate() ?? null,
            endingDate: dayjs(restSalon.endingDate).toDate() ?? null,
        };
    }
}
