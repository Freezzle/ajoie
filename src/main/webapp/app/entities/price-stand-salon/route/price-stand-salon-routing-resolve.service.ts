import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IPriceStandSalon } from '../price-stand-salon.model';
import { PriceStandSalonService } from '../service/price-stand-salon.service';

const priceStandSalonResolve = (route: ActivatedRouteSnapshot): Observable<null | IPriceStandSalon> => {
  const id = route.params['id'];
  if (id) {
    return inject(PriceStandSalonService)
      .find(id)
      .pipe(
        mergeMap((priceStandSalon: HttpResponse<IPriceStandSalon>) => {
          if (priceStandSalon.body) {
            return of(priceStandSalon.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default priceStandSalonResolve;
