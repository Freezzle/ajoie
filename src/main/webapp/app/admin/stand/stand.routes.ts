import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { StandComponent } from './list/stand.component';
import { StandUpdateComponent } from './update/stand-update.component';
import StandResolve from './route/stand-routing-resolve.service';

const standRoute: Routes = [
  {
    path: '',
    component: StandComponent,
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: StandUpdateComponent,
    resolve: {
      stand: StandResolve,
    },
    data: {
      readonly: true,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: StandUpdateComponent,
    resolve: {
      stand: StandResolve,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: StandUpdateComponent,
    resolve: {
      stand: StandResolve,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default standRoute;
