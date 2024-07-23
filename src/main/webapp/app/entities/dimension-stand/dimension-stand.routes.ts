import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { DimensionStandComponent } from './list/dimension-stand.component';
import { DimensionStandDetailComponent } from './detail/dimension-stand-detail.component';
import { DimensionStandUpdateComponent } from './update/dimension-stand-update.component';
import DimensionStandResolve from './route/dimension-stand-routing-resolve.service';

const dimensionStandRoute: Routes = [
  {
    path: '',
    component: DimensionStandComponent,
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: DimensionStandDetailComponent,
    resolve: {
      dimensionStand: DimensionStandResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: DimensionStandUpdateComponent,
    resolve: {
      dimensionStand: DimensionStandResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: DimensionStandUpdateComponent,
    resolve: {
      dimensionStand: DimensionStandResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default dimensionStandRoute;
