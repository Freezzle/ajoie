import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import dayjs from 'dayjs/esm';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { ISalon, NewSalon } from '../salon.model';

type RestOf<T extends ISalon | NewSalon> = Omit<T, 'startingDate' | 'endingDate'> & {
  startingDate?: string | null;
  endingDate?: string | null;
};

export type RestSalon = RestOf<ISalon>;
export type EntityResponseType = HttpResponse<ISalon>;
export type EntityArrayResponseType = HttpResponse<ISalon[]>;

@Injectable({ providedIn: 'root' })
export class SalonService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/salons');

  create(salon: NewSalon): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(salon);
    return this.http.post<RestSalon>(this.resourceUrl, copy, { observe: 'response' }).pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(salon: ISalon): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(salon);
    return this.http
      .put<RestSalon>(`${this.resourceUrl}/${this.getSalonIdentifier(salon)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http
      .get<RestSalon>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestSalon[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getSalonIdentifier(salon: Pick<ISalon, 'id'>): string {
    return salon.id;
  }

  compareSalon(o1: Pick<ISalon, 'id'> | null, o2: Pick<ISalon, 'id'> | null): boolean {
    return o1 && o2 ? this.getSalonIdentifier(o1) === this.getSalonIdentifier(o2) : o1 === o2;
  }

  protected convertResponseFromServer(res: HttpResponse<RestSalon>): HttpResponse<ISalon> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestSalon[]>): HttpResponse<ISalon[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }

  protected convertDateFromClient<T extends ISalon | NewSalon>(salon: T): RestOf<T> {
    return {
      ...salon,
      startingDate: salon.startingDate?.toJSON() ?? null,
      endingDate: salon.endingDate?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restSalon: RestSalon): ISalon {
    return {
      ...restSalon,
      startingDate: restSalon.startingDate ? dayjs(restSalon.startingDate) : undefined,
      endingDate: restSalon.endingDate ? dayjs(restSalon.endingDate) : undefined,
    };
  }
}
