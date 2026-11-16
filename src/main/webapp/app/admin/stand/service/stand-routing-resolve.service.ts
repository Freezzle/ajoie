import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, Router} from '@angular/router';
import {Observable} from 'rxjs';

import {IStand} from '../model/stand.interface';
import {StandService} from './stand.service';
import {resolveEntityById} from '../../common/route/resolve-entity.util';

const standResolve = (route: ActivatedRouteSnapshot): Observable<null | IStand> =>
    resolveEntityById(route, 'idStand', id => inject(StandService).find(id), inject(Router));

export default standResolve;
