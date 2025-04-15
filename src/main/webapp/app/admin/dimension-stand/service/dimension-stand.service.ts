import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IDimensionStand, NewDimensionStand } from '../dimension-stand.model';

@Injectable({ providedIn: 'root' })
export class DimensionStandService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/admin/dimension-stands');

  create(dimensionStand: NewDimensionStand): Observable<HttpResponse<IDimensionStand>> {
    return this.http.post<IDimensionStand>(this.resourceUrl, dimensionStand, { observe: 'response' });
  }

  update(dimensionStand: IDimensionStand): Observable<HttpResponse<IDimensionStand>> {
    return this.http.put<IDimensionStand>(`${this.resourceUrl}/${getDimensionStandIdentifier(dimensionStand)}`,
      dimensionStand, {
        observe: 'response',
      });
  }

  find(idDimension: string): Observable<HttpResponse<IDimensionStand>> {
    return this.http.get<IDimensionStand>(`${this.resourceUrl}/${idDimension}`, { observe: 'response' });
  }

  query(req?: any): Observable<IDimensionStand[]> {
    const options = createRequestOption(req);
    return this.http.get<IDimensionStand[]>(this.resourceUrl, { params: options });
  }

  delete(idDimension: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${idDimension}`, { observe: 'response' });
  }

  addDimensionsOptionsIfMissing<Type extends Pick<IDimensionStand, 'id'>>(
    dimensionStandCollection: Type[],
    ...dimensionStandsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const dimensionStands: Type[] = dimensionStandsToCheck.filter(isPresent);
    if (dimensionStands.length > 0) {
      const dimensionStandCollectionIdentifiers = dimensionStandCollection.map(dimensionStandItem =>
        getDimensionStandIdentifier(dimensionStandItem),
      );
      const dimensionStandsToAdd = dimensionStands.filter(dimensionStandItem => {
        const dimensionStandIdentifier = getDimensionStandIdentifier(dimensionStandItem);
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

export function getDimensionStandIdentifier(dimensionStand: Pick<IDimensionStand, 'id'>): string {
  return dimensionStand.id;
}

export function compareDimensionStand(o1: Pick<IDimensionStand, 'id'> | null,
                                      o2: Pick<IDimensionStand, 'id'> | null): boolean {
  return o1 && o2 ? getDimensionStandIdentifier(o1) === getDimensionStandIdentifier(o2) : o1 === o2;
}

export function formatterDimensionStand(dimension: IDimensionStand | null): string {
  return dimension?.dimension ?? '';
}
