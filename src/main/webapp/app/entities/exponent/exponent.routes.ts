import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ExponentComponent } from './list/exponent.component';
import { ExponentDetailComponent } from './detail/exponent-detail.component';
import { ExponentUpdateComponent } from './update/exponent-update.component';
import ExponentResolve from './route/exponent-routing-resolve.service';

const exponentRoute: Routes = [
  {
    path: '',
    component: ExponentComponent,
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: ExponentDetailComponent,
    resolve: {
      exponent: ExponentResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ExponentUpdateComponent,
    resolve: {
      exponent: ExponentResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: ExponentUpdateComponent,
    resolve: {
      exponent: ExponentResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default exponentRoute;
