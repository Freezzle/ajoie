import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IStand, NewStand } from '../stand.model';
import dayjs from 'dayjs/esm';

type RestOf<T extends IStand | NewStand> = Omit<T, 'registrationDate'> & {
  registrationDate?: string | null;
};

export type RestStand = RestOf<IStand>;
export type EntityResponseType = HttpResponse<IStand>;
export type EntityArrayResponseType = HttpResponse<IStand[]>;

@Injectable({ providedIn: 'root' })
export class StandService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/stands');

  create(stand: NewStand): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(stand);
    return this.http.post<RestStand>(this.resourceUrl, copy, { observe: 'response' }).pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(stand: IStand): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(stand);
    return this.http
      .put<RestStand>(`${this.resourceUrl}/${this.getStandIdentifier(stand)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IStand>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestStand[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getStandIdentifier(stand: Pick<IStand, 'id'>): string {
    return stand.id;
  }

  compareStand(o1: Pick<IStand, 'id'> | null, o2: Pick<IStand, 'id'> | null): boolean {
    return o1 && o2 ? this.getStandIdentifier(o1) === this.getStandIdentifier(o2) : o1 === o2;
  }

  protected convertResponseFromServer(res: HttpResponse<RestStand>): HttpResponse<IStand> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestStand[]>): HttpResponse<IStand[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }

  protected convertDateFromClient<T extends IStand | NewStand>(stand: T): RestOf<T> {
    return {
      ...stand,
      registrationDate: stand.registrationDate?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restStand: RestStand): IStand {
    return {
      ...restStand,
      registrationDate: restStand.registrationDate ? dayjs(restStand.registrationDate) : undefined,
    };
  }
}
