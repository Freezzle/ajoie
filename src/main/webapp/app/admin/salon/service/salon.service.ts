import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { map, Observable, of } from 'rxjs';

import dayjs from 'dayjs/esm';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { ISalon, ISalonStats, NewSalon } from '../salon.model';
import { isPresent } from '../../../core/util/operators';
import { Status } from '../../enumerations/status.model';
import { IDimensionStand } from '../../dimension-stand/dimension-stand.model';

@Injectable({ providedIn: 'root' })
export class SalonService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);
  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/salons');

  create(salon: NewSalon): Observable<HttpResponse<ISalon>> {
    const copy = this.convertDateFromClient(salon);
    return this.http.post<ISalon>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(salon: ISalon): Observable<HttpResponse<ISalon>> {
    const copy = this.convertDateFromClient(salon);
    return this.http
      .put<ISalon>(`${this.resourceUrl}/${this.getSalonIdentifier(salon)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(idSalon: string): Observable<HttpResponse<ISalon>> {
    return this.http
      .get<ISalon>(`${this.resourceUrl}/${idSalon}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  stats(idSalon: string, statuses: Status[]): Observable<HttpResponse<ISalonStats>> {
    let params = new HttpParams();
    statuses.forEach(status => {
      params = params.append('statuses', status.toString());
    });

    return this.http.get<ISalonStats>(`${this.resourceUrl}/${idSalon}/stats`, { params, observe: 'response' });
  }

  query(req?: any): Observable<HttpResponse<ISalon[]>> {
    const options = createRequestOption(req);
    return this.http
      .get<ISalon[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  generate(idSalon: string, selectedFile: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', selectedFile);
    return this.http.post<any>(`${this.resourceUrl}/${idSalon}/import-inscriptions`, formData, { observe: 'response' });
  }

  delete(idSalon: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${idSalon}`, { observe: 'response' });
  }

  getSalonIdentifier(salon: Pick<ISalon, 'id'>): string {
    return salon.id;
  }

  addSalonOptionsIfMissing<Type extends Pick<ISalon, 'id'>>(
    salonCollection: Type[],
    ...salonsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const salons: Type[] = salonsToCheck.filter(isPresent);
    if (salons.length > 0) {
      const salonCollectionIdentifiers = salonCollection.map(salonItem => this.getSalonIdentifier(salonItem));
      const salonsToAdd = salons.filter(salonItem => {
        const salonIdentifier = this.getSalonIdentifier(salonItem);
        if (salonCollectionIdentifiers.includes(salonIdentifier)) {
          return false;
        }
        salonCollectionIdentifiers.push(salonIdentifier);
        return true;
      });
      return [...salonsToAdd, ...salonCollection];
    }
    return salonCollection;
  }

  getDimensionStands(idSalon: string | null): Observable<IDimensionStand[]> {
    if (!idSalon) {
      return of([]);
    }
    return this.http.get<IDimensionStand[]>(`${this.resourceUrl}/${idSalon}/dimension-stands`);
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
      startingDate: restSalon.startingDate ? dayjs(restSalon.startingDate) : undefined,
      endingDate: restSalon.endingDate ? dayjs(restSalon.endingDate) : undefined,
    };
  }
}
