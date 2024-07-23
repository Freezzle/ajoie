import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { ISalon } from '../salon.model';
import { SalonService } from '../service/salon.service';

const salonResolve = (route: ActivatedRouteSnapshot): Observable<null | ISalon> => {
  const id = route.params['id'];
  if (id) {
    return inject(SalonService)
      .find(id)
      .pipe(
        mergeMap((salon: HttpResponse<ISalon>) => {
          if (salon.body) {
            return of(salon.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default salonResolve;
