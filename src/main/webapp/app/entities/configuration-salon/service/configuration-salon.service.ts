import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IConfigurationSalon, NewConfigurationSalon } from '../configuration-salon.model';

export type PartialUpdateConfigurationSalon = Partial<IConfigurationSalon> & Pick<IConfigurationSalon, 'id'>;

export type EntityResponseType = HttpResponse<IConfigurationSalon>;
export type EntityArrayResponseType = HttpResponse<IConfigurationSalon[]>;

@Injectable({ providedIn: 'root' })
export class ConfigurationSalonService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/configuration-salons');

  create(configurationSalon: NewConfigurationSalon): Observable<EntityResponseType> {
    return this.http.post<IConfigurationSalon>(this.resourceUrl, configurationSalon, { observe: 'response' });
  }

  update(configurationSalon: IConfigurationSalon): Observable<EntityResponseType> {
    return this.http.put<IConfigurationSalon>(
      `${this.resourceUrl}/${this.getConfigurationSalonIdentifier(configurationSalon)}`,
      configurationSalon,
      { observe: 'response' },
    );
  }

  partialUpdate(configurationSalon: PartialUpdateConfigurationSalon): Observable<EntityResponseType> {
    return this.http.patch<IConfigurationSalon>(
      `${this.resourceUrl}/${this.getConfigurationSalonIdentifier(configurationSalon)}`,
      configurationSalon,
      { observe: 'response' },
    );
  }

  find(id: string): Observable<EntityResponseType> {
    return this.http.get<IConfigurationSalon>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IConfigurationSalon[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getConfigurationSalonIdentifier(configurationSalon: Pick<IConfigurationSalon, 'id'>): string {
    return configurationSalon.id;
  }

  compareConfigurationSalon(o1: Pick<IConfigurationSalon, 'id'> | null, o2: Pick<IConfigurationSalon, 'id'> | null): boolean {
    return o1 && o2 ? this.getConfigurationSalonIdentifier(o1) === this.getConfigurationSalonIdentifier(o2) : o1 === o2;
  }

  addConfigurationSalonToCollectionIfMissing<Type extends Pick<IConfigurationSalon, 'id'>>(
    configurationSalonCollection: Type[],
    ...configurationSalonsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const configurationSalons: Type[] = configurationSalonsToCheck.filter(isPresent);
    if (configurationSalons.length > 0) {
      const configurationSalonCollectionIdentifiers = configurationSalonCollection.map(configurationSalonItem =>
        this.getConfigurationSalonIdentifier(configurationSalonItem),
      );
      const configurationSalonsToAdd = configurationSalons.filter(configurationSalonItem => {
        const configurationSalonIdentifier = this.getConfigurationSalonIdentifier(configurationSalonItem);
        if (configurationSalonCollectionIdentifiers.includes(configurationSalonIdentifier)) {
          return false;
        }
        configurationSalonCollectionIdentifiers.push(configurationSalonIdentifier);
        return true;
      });
      return [...configurationSalonsToAdd, ...configurationSalonCollection];
    }
    return configurationSalonCollection;
  }
}
