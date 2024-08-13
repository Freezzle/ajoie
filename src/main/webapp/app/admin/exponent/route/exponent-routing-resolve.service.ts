import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IExponent } from '../exponent.model';
import { ExponentService } from '../service/exponent.service';

const exponentResolve = (route: ActivatedRouteSnapshot): Observable<null | IExponent> => {
  const id = route.params['id'];
  if (id) {
    return inject(ExponentService)
      .find(id)
      .pipe(
        mergeMap((exponent: HttpResponse<IExponent>) => {
          if (exponent.body) {
            return of(exponent.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default exponentResolve;
