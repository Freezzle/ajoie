import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ConfigurationSalonComponent } from './list/configuration-salon.component';
import { ConfigurationSalonDetailComponent } from './detail/configuration-salon-detail.component';
import { ConfigurationSalonUpdateComponent } from './update/configuration-salon-update.component';
import ConfigurationSalonResolve from './route/configuration-salon-routing-resolve.service';

const configurationSalonRoute: Routes = [
  {
    path: '',
    component: ConfigurationSalonComponent,
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: ConfigurationSalonDetailComponent,
    resolve: {
      configurationSalon: ConfigurationSalonResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ConfigurationSalonUpdateComponent,
    resolve: {
      configurationSalon: ConfigurationSalonResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: ConfigurationSalonUpdateComponent,
    resolve: {
      configurationSalon: ConfigurationSalonResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default configurationSalonRoute;
