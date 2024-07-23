import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { BillingComponent } from './list/billing.component';
import { BillingDetailComponent } from './detail/billing-detail.component';
import { BillingUpdateComponent } from './update/billing-update.component';
import BillingResolve from './route/billing-routing-resolve.service';

const billingRoute: Routes = [
  {
    path: '',
    component: BillingComponent,
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: BillingDetailComponent,
    resolve: {
      billing: BillingResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: BillingUpdateComponent,
    resolve: {
      billing: BillingResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: BillingUpdateComponent,
    resolve: {
      billing: BillingResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default billingRoute;
