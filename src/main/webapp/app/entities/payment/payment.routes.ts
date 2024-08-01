import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { PaymentComponent } from './list/payment.component';
import { PaymentDetailComponent } from './detail/payment-detail.component';
import { PaymentUpdateComponent } from './update/payment-update.component';
import PaymentResolve from './route/payment-routing-resolve.service';

const paymentRoute: Routes = [
  {
    path: '',
    component: PaymentComponent,
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: PaymentDetailComponent,
    resolve: {
      payment: PaymentResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: PaymentUpdateComponent,
    resolve: {
      payment: PaymentResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: PaymentUpdateComponent,
    resolve: {
      payment: PaymentResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default paymentRoute;
