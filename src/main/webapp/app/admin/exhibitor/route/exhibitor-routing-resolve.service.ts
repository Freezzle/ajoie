import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import {IExhibitor}from '../exhibitor.model';
import { ExhibitorService}from '../service/exhibitor.service';

const exhibitorResolve = (route: ActivatedRouteSnapshot): Observable<null | IExhibitor> => {
  const id = route.params['id'];
  if (id) {
    return inject(ExhibitorService)
      .find(id)
      .pipe(
        mergeMap((exhibitor: HttpResponse<IExhibitor>) => {
          if (exhibitor.body) {
            return of(exhibitor.body);
          } else {
            inject(Router).navigate(['404']);
            return EMPTY;
          }
        }),
      );
  }
  return of(null);
};

export default exhibitorResolve;
