import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { PriceStandSalonComponent } from './list/price-stand-salon.component';
import { PriceStandSalonDetailComponent } from './detail/price-stand-salon-detail.component';
import { PriceStandSalonUpdateComponent } from './update/price-stand-salon-update.component';
import PriceStandSalonResolve from './route/price-stand-salon-routing-resolve.service';

const priceStandSalonRoute: Routes = [
  {
    path: '',
    component: PriceStandSalonComponent,
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: PriceStandSalonDetailComponent,
    resolve: {
      priceStandSalon: PriceStandSalonResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: PriceStandSalonUpdateComponent,
    resolve: {
      priceStandSalon: PriceStandSalonResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: PriceStandSalonUpdateComponent,
    resolve: {
      priceStandSalon: PriceStandSalonResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default priceStandSalonRoute;
