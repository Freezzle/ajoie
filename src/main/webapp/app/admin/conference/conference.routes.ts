import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ConferenceComponent } from './list/conference.component';
import { ConferenceUpdateComponent } from './update/conference-update.component';
import ConferenceResolve from './route/conference-routing-resolve.service';

const conferenceRoute: Routes = [
  {
    path: '',
    component: ConferenceComponent,
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: ConferenceUpdateComponent,
    resolve: {
      conference: ConferenceResolve,
    },
    data: {
      readonly: true,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ConferenceUpdateComponent,
    resolve: {
      conference: ConferenceResolve,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: ConferenceUpdateComponent,
    resolve: {
      conference: ConferenceResolve,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default conferenceRoute;
