import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IBilling } from '../billing.model';
import { BillingService } from '../service/billing.service';

const billingResolve = (route: ActivatedRouteSnapshot): Observable<null | IBilling> => {
  const id = route.params['id'];
  if (id) {
    return inject(BillingService)
      .find(id)
      .pipe(
        mergeMap((billing: HttpResponse<IBilling>) => {
          if (billing.body) {
            return of(billing.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default billingResolve;
