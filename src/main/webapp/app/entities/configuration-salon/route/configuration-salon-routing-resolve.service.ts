import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { of, EMPTY, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IConfigurationSalon } from '../configuration-salon.model';
import { ConfigurationSalonService } from '../service/configuration-salon.service';

const configurationSalonResolve = (route: ActivatedRouteSnapshot): Observable<null | IConfigurationSalon> => {
  const id = route.params['id'];
  if (id) {
    return inject(ConfigurationSalonService)
      .find(id)
      .pipe(
        mergeMap((configurationSalon: HttpResponse<IConfigurationSalon>) => {
          if (configurationSalon.body) {
            return of(configurationSalon.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default configurationSalonResolve;
