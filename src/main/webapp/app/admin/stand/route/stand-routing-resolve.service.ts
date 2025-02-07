import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IStand } from '../stand.model';
import { StandService } from '../service/stand.service';

const standResolve = (route: ActivatedRouteSnapshot): Observable<null | IStand> => {
  const id = route.params['idStand'];
  if (id) {
    return inject(StandService)
      .find(id)
      .pipe(
        mergeMap((stand: HttpResponse<IStand>) => {
          if (stand.body) {
            return of(stand.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default standResolve;
