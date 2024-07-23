import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IDimensionStand } from '../dimension-stand.model';
import { DimensionStandService } from '../service/dimension-stand.service';

const dimensionStandResolve = (route: ActivatedRouteSnapshot): Observable<null | IDimensionStand> => {
  const id = route.params['id'];
  if (id) {
    return inject(DimensionStandService)
      .find(id)
      .pipe(
        mergeMap((dimensionStand: HttpResponse<IDimensionStand>) => {
          if (dimensionStand.body) {
            return of(dimensionStand.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default dimensionStandResolve;
