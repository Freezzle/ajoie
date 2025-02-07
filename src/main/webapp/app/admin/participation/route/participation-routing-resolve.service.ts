import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IParticipation } from '../participation.model';
import { ParticipationService } from '../service/participation.service';

const participationResolve = (route: ActivatedRouteSnapshot): Observable<null | IParticipation> => {
  const id = route.params['idParticipation'];
  if (id) {
    return inject(ParticipationService)
      .find(id)
      .pipe(
        mergeMap((participation: HttpResponse<IParticipation>) => {
          if (participation.body) {
            return of(participation.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default participationResolve;
