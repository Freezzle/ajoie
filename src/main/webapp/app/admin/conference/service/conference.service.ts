import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IConference, NewConference } from '../conference.model';

export type PartialUpdateConference = Partial<IConference> & Pick<IConference, 'id'>;

export type EntityResponseType = HttpResponse<IConference>;
export type EntityArrayResponseType = HttpResponse<IConference[]>;

@Injectable({ providedIn: 'root' })
export class ConferenceService {
  protected http = inject(HttpClient);
  protected applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/conferences');

  create(conference: NewConference): Observable<EntityResponseType> {
    return this.http.post<IConference>(this.resourceUrl, conference, { observe: 'response' });
  }

  update(conference: IConference): Observable<EntityResponseType> {
    return this.http.put<IConference>(`${this.resourceUrl}/${this.getConferenceIdentifier(conference)}`, conference, {
      observe: 'response',
    });
  }

  partialUpdate(conference: PartialUpdateConference): Observable<EntityResponseType> {
    return this.http.patch<IConference>(`${this.resourceUrl}/${this.getConferenceIdentifier(conference)}`, conference, {
      observe: 'response',
    });
  }

  find(idConference: string): Observable<EntityResponseType> {
    return this.http.get<IConference>(`${this.resourceUrl}/${idConference}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<IConference[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(idConference: string): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${idConference}`, { observe: 'response' });
  }

  getConferenceIdentifier(conference: Pick<IConference, 'id'>): string {
    return conference.id;
  }

  compareConference(o1: Pick<IConference, 'id'> | null, o2: Pick<IConference, 'id'> | null): boolean {
    return o1 && o2 ? this.getConferenceIdentifier(o1) === this.getConferenceIdentifier(o2) : o1 === o2;
  }

  addConferenceToCollectionIfMissing<Type extends Pick<IConference, 'id'>>(
    conferenceCollection: Type[],
    ...conferencesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const conferences: Type[] = conferencesToCheck.filter(isPresent);
    if (conferences.length > 0) {
      const conferenceCollectionIdentifiers = conferenceCollection.map(conferenceItem => this.getConferenceIdentifier(conferenceItem));
      const conferencesToAdd = conferences.filter(conferenceItem => {
        const conferenceIdentifier = this.getConferenceIdentifier(conferenceItem);
        if (conferenceCollectionIdentifiers.includes(conferenceIdentifier)) {
          return false;
        }
        conferenceCollectionIdentifiers.push(conferenceIdentifier);
        return true;
      });
      return [...conferencesToAdd, ...conferenceCollection];
    }
    return conferenceCollection;
  }
}
