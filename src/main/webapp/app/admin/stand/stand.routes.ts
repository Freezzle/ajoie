import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { StandComponent } from './list/stand.component';
import { StandDetailComponent } from './detail/stand-detail.component';
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
    component: StandDetailComponent,
    resolve: {
      stand: StandResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: StandUpdateComponent,
    resolve: {
      stand: StandResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: StandUpdateComponent,
    resolve: {
      stand: StandResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default standRoute;
