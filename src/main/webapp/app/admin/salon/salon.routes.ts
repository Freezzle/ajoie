import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { SalonComponent } from './list/salon.component';
import { SalonStatsComponent } from './stats/salon-stats.component';
import { SalonUpdateComponent } from './update/salon-update.component';
import SalonResolve from './route/salon-routing-resolve.service';

const salonRoute: Routes = [
  {
    path: '',
    component: SalonComponent,
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idSalon/stats',
    component: SalonStatsComponent,
    resolve: {
      salon: SalonResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idSalon/view',
    component: SalonUpdateComponent,
    resolve: {
      salon: SalonResolve,
    },
    data: {
      readonly: true,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: SalonUpdateComponent,
    resolve: {
      salon: SalonResolve,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idSalon/edit',
    component: SalonUpdateComponent,
    resolve: {
      salon: SalonResolve,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idSalon/conferences',
    loadChildren: () => import('../conference/conference.routes'),
  },
  {
    path: ':idSalon/stands',
    loadChildren: () => import('../stand/stand.routes'),
  },
  {
    path: ':idSalon/participations',
    loadChildren: () => import('../participation/participation.routes'),
  },
];

export default salonRoute;
