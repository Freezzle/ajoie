import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ParticipationComponent } from './list/participation.component';
import { ParticipationDetailComponent } from './detail/participation-detail.component';
import { ParticipationUpdateComponent } from './update/participation-update.component';
import ParticipationResolve from './route/participation-routing-resolve.service';
import conferenceRoutes from '../conference/conference.routes';
import standRoutes from '../stand/stand.routes';

const participationRoute: Routes = [
  {
    path: '',
    component: ParticipationComponent,
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ParticipationUpdateComponent,
    resolve: {
      salon: ParticipationResolve,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idParticipation/billings',
    component: ParticipationDetailComponent,
    resolve: {
      participation: ParticipationResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idParticipation/view',
    component: ParticipationUpdateComponent,
    resolve: {
      participation: ParticipationResolve,
    },
    data: {
      readonly: true,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idParticipation/conferences',
    children: conferenceRoutes,
  },
  {
    path: ':idParticipation/stands',
    children: standRoutes,
  },
  {
    path: ':idParticipation/edit',
    component: ParticipationUpdateComponent,
    resolve: {
      participation: ParticipationResolve,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default participationRoute;
