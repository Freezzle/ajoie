import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, Router} from '@angular/router';
import {Observable} from 'rxjs';

import {IParticipation} from '../model/participation.interface';
import {ParticipationService} from './participation.service';
import {resolveEntityById} from '../../common/route/resolve-entity.util';

const participationResolve = (route: ActivatedRouteSnapshot): Observable<null | IParticipation> =>
    resolveEntityById(route, 'idParticipation', id => inject(ParticipationService).find(id), inject(Router));

export default participationResolve;
