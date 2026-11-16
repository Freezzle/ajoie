import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, Router} from '@angular/router';
import {Observable} from 'rxjs';

import {IWorkshop} from '../model/workshop.interface';
import {WorkshopService} from './workshop.service';
import {resolveEntityById} from '../../common/route/resolve-entity.util';

const workshopResolve = (route: ActivatedRouteSnapshot): Observable<null | IWorkshop> =>
    resolveEntityById(route, 'idWorkshop', id => inject(WorkshopService).find(id), inject(Router));

export default workshopResolve;
