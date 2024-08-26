import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ExhibitorComponent } from './list/exhibitor.component';
import { ExhibitorUpdateComponent } from './update/exhibitor-update.component';
import ExhibitorResolve from './route/exhibitor-routing-resolve.service';

const exhibitorRoute: Routes = [
  {
    path: '',
    component: ExhibitorComponent,
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idExhibitor/view',
    component: ExhibitorUpdateComponent,
    resolve: {
      exhibitor: ExhibitorResolve,
    },
    data: {
      readonly: true,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ExhibitorUpdateComponent,
    resolve: {
      exhibitor: ExhibitorResolve,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idExhibitor/edit',
    component: ExhibitorUpdateComponent,
    resolve: {
      exhibitor: ExhibitorResolve,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default exhibitorRoute;
