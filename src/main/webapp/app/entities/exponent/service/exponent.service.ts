import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IExponent, NewExponent } from '../exponent.model';

export type PartialUpdateExponent = Partial<IExponent> & Pick<IExponent, 'id'>;

export type EntityResponseType = HttpResponse<IExponent>;
export type EntityArrayResponseType = HttpResponse<IExponent[]>;

@Injectable({ providedIn: 'root' })
export class ExponentService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/exponents');

  create(exponent: NewExponent): Observable<EntityResponseType> {
    return this.http.post<IExponent>(this.resourceUrl, exponent, { observe: 'response' });
  }

  update(exponent: IExponent): Observable<EntityResponseType> {
    return this.http.put<IExponent>(`${this.resourceUrl}/${this.getExponentIdentifier(exponent)}`, exponent, { observe: 'response' });
  }

  partialUpdate(exponent: PartialUpdateExponent): Observable<EntityResponseType> {
    return this.http.patch<IExponent>(`${this.resourceUrl}/${this.getExponentIdentifier(exponent)}`, exponent, { observe: 'response' });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IExponent>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IExponent[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getExponentIdentifier(exponent: Pick<IExponent, 'id'>): string {
    return exponent.id;
  }

  compareExponent(o1: Pick<IExponent, 'id'> | null, o2: Pick<IExponent, 'id'> | null): boolean {
    return o1 && o2 ? this.getExponentIdentifier(o1) === this.getExponentIdentifier(o2) : o1 === o2;
  }

  addExponentToCollectionIfMissing<Type extends Pick<IExponent, 'id'>>(
    exponentCollection: Type[],
    ...exponentsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const exponents: Type[] = exponentsToCheck.filter(isPresent);
    if (exponents.length > 0) {
      const exponentCollectionIdentifiers = exponentCollection.map(exponentItem => this.getExponentIdentifier(exponentItem));
      const exponentsToAdd = exponents.filter(exponentItem => {
        const exponentIdentifier = this.getExponentIdentifier(exponentItem);
        if (exponentCollectionIdentifiers.includes(exponentIdentifier)) {
          return false;
        }
        exponentCollectionIdentifiers.push(exponentIdentifier);
        return true;
      });
      return [...exponentsToAdd, ...exponentCollection];
    }
    return exponentCollection;
  }
}
