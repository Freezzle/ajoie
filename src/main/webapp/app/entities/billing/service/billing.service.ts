import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IBilling, NewBilling } from '../billing.model';

export type PartialUpdateBilling = Partial<IBilling> & Pick<IBilling, 'id'>;

export type EntityResponseType = HttpResponse<IBilling>;
export type EntityArrayResponseType = HttpResponse<IBilling[]>;

@Injectable({ providedIn: 'root' })
export class BillingService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/billings');

  create(billing: NewBilling): Observable<EntityResponseType> {
    return this.http.post<IBilling>(this.resourceUrl, billing, { observe: 'response' });
  }

  update(billing: IBilling): Observable<EntityResponseType> {
    return this.http.put<IBilling>(`${this.resourceUrl}/${this.getBillingIdentifier(billing)}`, billing, { observe: 'response' });
  }

  partialUpdate(billing: PartialUpdateBilling): Observable<EntityResponseType> {
    return this.http.patch<IBilling>(`${this.resourceUrl}/${this.getBillingIdentifier(billing)}`, billing, { observe: 'response' });
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IBilling>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IBilling[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getBillingIdentifier(billing: Pick<IBilling, 'id'>): string {
    return billing.id;
  }

  compareBilling(o1: Pick<IBilling, 'id'> | null, o2: Pick<IBilling, 'id'> | null): boolean {
    return o1 && o2 ? this.getBillingIdentifier(o1) === this.getBillingIdentifier(o2) : o1 === o2;
  }

  addBillingToCollectionIfMissing<Type extends Pick<IBilling, 'id'>>(
    billingCollection: Type[],
    ...billingsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const billings: Type[] = billingsToCheck.filter(isPresent);
    if (billings.length > 0) {
      const billingCollectionIdentifiers = billingCollection.map(billingItem => this.getBillingIdentifier(billingItem));
      const billingsToAdd = billings.filter(billingItem => {
        const billingIdentifier = this.getBillingIdentifier(billingItem);
        if (billingCollectionIdentifiers.includes(billingIdentifier)) {
          return false;
        }
        billingCollectionIdentifiers.push(billingIdentifier);
        return true;
      });
      return [...billingsToAdd, ...billingCollection];
    }
    return billingCollection;
  }
}
