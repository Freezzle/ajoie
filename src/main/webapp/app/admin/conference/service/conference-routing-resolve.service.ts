import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, Router} from '@angular/router';
import {Observable} from 'rxjs';

import {IConference} from '../model/conference.interface';
import {ConferenceService} from './conference.service';
import {resolveEntityById} from '../../common/route/resolve-entity.util';

const conferenceResolve = (route: ActivatedRouteSnapshot): Observable<null | IConference> =>
    resolveEntityById(route, 'idConference', id => inject(ConferenceService).find(id), inject(Router));

export default conferenceResolve;
