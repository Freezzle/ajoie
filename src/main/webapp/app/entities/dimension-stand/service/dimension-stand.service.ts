import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IDimensionStand, NewDimensionStand } from '../dimension-stand.model';

export type PartialUpdateDimensionStand = Partial<IDimensionStand> & Pick<IDimensionStand, 'id'>;

export type EntityResponseType = HttpResponse<IDimensionStand>;
export type EntityArrayResponseType = HttpResponse<IDimensionStand[]>;

@Injectable({ providedIn: 'root' })
export class DimensionStandService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/dimension-stands');

  create(dimensionStand: NewDimensionStand): Observable<EntityResponseType> {
    return this.http.post<IDimensionStand>(this.resourceUrl, dimensionStand, { observe: 'response' });
  }

  update(dimensionStand: IDimensionStand): Observable<EntityResponseType> {
    return this.http.put<IDimensionStand>(`${this.resourceUrl}/${this.getDimensionStandIdentifier(dimensionStand)}`, dimensionStand, {
      observe: 'response',
    });
  }

  partialUpdate(dimensionStand: PartialUpdateDimensionStand): Observable<EntityResponseType> {
    return this.http.patch<IDimensionStand>(`${this.resourceUrl}/${this.getDimensionStandIdentifier(dimensionStand)}`, dimensionStand, {
      observe: 'response',
    });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IDimensionStand>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IDimensionStand[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getDimensionStandIdentifier(dimensionStand: Pick<IDimensionStand, 'id'>): string {
    return dimensionStand.id;
  }

  compareDimensionStand(o1: Pick<IDimensionStand, 'id'> | null, o2: Pick<IDimensionStand, 'id'> | null): boolean {
    return o1 && o2 ? this.getDimensionStandIdentifier(o1) === this.getDimensionStandIdentifier(o2) : o1 === o2;
  }

  addDimensionStandToCollectionIfMissing<Type extends Pick<IDimensionStand, 'id'>>(
    dimensionStandCollection: Type[],
    ...dimensionStandsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const dimensionStands: Type[] = dimensionStandsToCheck.filter(isPresent);
    if (dimensionStands.length > 0) {
      const dimensionStandCollectionIdentifiers = dimensionStandCollection.map(dimensionStandItem =>
        this.getDimensionStandIdentifier(dimensionStandItem),
      );
      const dimensionStandsToAdd = dimensionStands.filter(dimensionStandItem => {
        const dimensionStandIdentifier = this.getDimensionStandIdentifier(dimensionStandItem);
        if (dimensionStandCollectionIdentifiers.includes(dimensionStandIdentifier)) {
          return false;
        }
        dimensionStandCollectionIdentifiers.push(dimensionStandIdentifier);
        return true;
      });
      return [...dimensionStandsToAdd, ...dimensionStandCollection];
    }
    return dimensionStandCollection;
  }
}
