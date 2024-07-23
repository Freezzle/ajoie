import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IPriceStandSalon, NewPriceStandSalon } from '../price-stand-salon.model';

export type PartialUpdatePriceStandSalon = Partial<IPriceStandSalon> & Pick<IPriceStandSalon, 'id'>;

export type EntityResponseType = HttpResponse<IPriceStandSalon>;
export type EntityArrayResponseType = HttpResponse<IPriceStandSalon[]>;

@Injectable({ providedIn: 'root' })
export class PriceStandSalonService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/price-stand-salons');

  create(priceStandSalon: NewPriceStandSalon): Observable<EntityResponseType> {
    return this.http.post<IPriceStandSalon>(this.resourceUrl, priceStandSalon, { observe: 'response' });
  }

  update(priceStandSalon: IPriceStandSalon): Observable<EntityResponseType> {
    return this.http.put<IPriceStandSalon>(`${this.resourceUrl}/${this.getPriceStandSalonIdentifier(priceStandSalon)}`, priceStandSalon, {
      observe: 'response',
    });
  }

  partialUpdate(priceStandSalon: PartialUpdatePriceStandSalon): Observable<EntityResponseType> {
    return this.http.patch<IPriceStandSalon>(`${this.resourceUrl}/${this.getPriceStandSalonIdentifier(priceStandSalon)}`, priceStandSalon, {
      observe: 'response',
    });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IPriceStandSalon>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IPriceStandSalon[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getPriceStandSalonIdentifier(priceStandSalon: Pick<IPriceStandSalon, 'id'>): string {
    return priceStandSalon.id;
  }

  comparePriceStandSalon(o1: Pick<IPriceStandSalon, 'id'> | null, o2: Pick<IPriceStandSalon, 'id'> | null): boolean {
    return o1 && o2 ? this.getPriceStandSalonIdentifier(o1) === this.getPriceStandSalonIdentifier(o2) : o1 === o2;
  }

  addPriceStandSalonToCollectionIfMissing<Type extends Pick<IPriceStandSalon, 'id'>>(
    priceStandSalonCollection: Type[],
    ...priceStandSalonsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const priceStandSalons: Type[] = priceStandSalonsToCheck.filter(isPresent);
    if (priceStandSalons.length > 0) {
      const priceStandSalonCollectionIdentifiers = priceStandSalonCollection.map(priceStandSalonItem =>
        this.getPriceStandSalonIdentifier(priceStandSalonItem),
      );
      const priceStandSalonsToAdd = priceStandSalons.filter(priceStandSalonItem => {
        const priceStandSalonIdentifier = this.getPriceStandSalonIdentifier(priceStandSalonItem);
        if (priceStandSalonCollectionIdentifiers.includes(priceStandSalonIdentifier)) {
          return false;
        }
        priceStandSalonCollectionIdentifiers.push(priceStandSalonIdentifier);
        return true;
      });
      return [...priceStandSalonsToAdd, ...priceStandSalonCollection];
    }
    return priceStandSalonCollection;
  }
}
