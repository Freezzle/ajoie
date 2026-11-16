import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, Router} from '@angular/router';
import {Observable} from 'rxjs';

import {ISalon} from '../model/salon.interface';
import {SalonService} from './salon.service';
import {resolveEntityById} from '../../common/route/resolve-entity.util';

const salonResolve = (route: ActivatedRouteSnapshot): Observable<null | ISalon> =>
    resolveEntityById(route, 'idSalon', id => inject(SalonService).find(id), inject(Router));

export default salonResolve;
