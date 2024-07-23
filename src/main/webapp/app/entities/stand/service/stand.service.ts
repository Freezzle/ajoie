import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IStand, NewStand } from '../stand.model';

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

  partialUpdate(stand: PartialUpdateStand): Observable<EntityResponseType> {
    return this.http.patch<IStand>(`${this.resourceUrl}/${this.getStandIdentifier(stand)}`, stand, { observe: 'response' });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IStand>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IStand[]>(this.resourceUrl, { params: options, observe: 'response' });
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

  addStandToCollectionIfMissing<Type extends Pick<IStand, 'id'>>(
    standCollection: Type[],
    ...standsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const stands: Type[] = standsToCheck.filter(isPresent);
    if (stands.length > 0) {
      const standCollectionIdentifiers = standCollection.map(standItem => this.getStandIdentifier(standItem));
      const standsToAdd = stands.filter(standItem => {
        const standIdentifier = this.getStandIdentifier(standItem);
        if (standCollectionIdentifiers.includes(standIdentifier)) {
          return false;
        }
        standCollectionIdentifiers.push(standIdentifier);
        return true;
      });
      return [...standsToAdd, ...standCollection];
    }
    return standCollection;
  }
}
