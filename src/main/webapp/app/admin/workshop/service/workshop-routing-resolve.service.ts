import {inject} from '@angular/core';
import {HttpResponse} from '@angular/common/http';
import {ActivatedRouteSnapshot, Router} from '@angular/router';
import {EMPTY, Observable, of} from 'rxjs';
import {mergeMap} from 'rxjs/operators';

import {IWorkshop} from '../model/workshop.interface';
import {WorkshopService} from './workshop.service';

const workshopResolve = (route: ActivatedRouteSnapshot): Observable<null | IWorkshop> => {
    const id = route.params['idWorkshop'];
    if (id) {
        return inject(WorkshopService)
            .find(id)
            .pipe(
                mergeMap((workshop: HttpResponse<IWorkshop>) => {
                    if (workshop.body) {
                        return of(workshop.body);
                    } else {
                        inject(Router).navigate(['404']);
                        return EMPTY;
                    }
                })
            );
    }
    return of(null);
};

export default workshopResolve;
