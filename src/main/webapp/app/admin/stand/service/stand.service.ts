import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IStand, NewStand } from '../stand.model';
import { isPresent } from '../../../core/util/operators';

export type PartialUpdateStand = Partial<IStand> & Pick<IStand, 'id'>;

export type EntityResponseType = HttpResponse<IStand>;
export type EntityArrayResponseType = HttpResponse<IStand[]>;

@Injectable({ providedIn: 'root' })
export class StandService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/stands');

  create(stand: NewStand): Observable<EntityResponseType> {
    return this.http.post<IStand>(this.resourceUrl, stand, { observe: 'response' });
  }

  update(stand: IStand): Observable<EntityResponseType> {
    return this.http.put<IStand>(`${this.resourceUrl}/${this.getStandIdentifier(stand)}`, stand, { observe: 'response' });
  }

  find(idStand: string): Observable<EntityResponseType> {
    return this.http.get<IStand>(`${this.resourceUrl}/${idStand}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IStand[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(idStand: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${idStand}`, { observe: 'response' });
  }

  getStandIdentifier(stand: Pick<IStand, 'id'>): string {
    return stand.id;
  }
}
