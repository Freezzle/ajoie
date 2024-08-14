import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ParticipationComponent } from './list/participation.component';
import { ParticipationDetailComponent } from './detail/participation-detail.component';
import { ParticipationUpdateComponent } from './update/participation-update.component';
import ParticipationResolve from './route/participation-routing-resolve.service';
import { ConferenceUpdateComponent } from '../conference/update/conference-update.component';
import ConferenceRoutingResolveService from '../conference/route/conference-routing-resolve.service';
import { StandUpdateComponent } from '../stand/update/stand-update.component';
import StandRoutingResolveService from '../stand/route/stand-routing-resolve.service';

const participationRoute: Routes = [
  {
    path: '',
    component: ParticipationComponent,
    data: {},
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
    path: ':idParticipation/conferences/:idConference/view',
    component: ConferenceUpdateComponent,
    resolve: {
      conference: ConferenceRoutingResolveService,
    },
    data: {
      readonly: true,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idParticipation/conferences/:idConference/edit',
    component: ConferenceUpdateComponent,
    resolve: {
      conference: ConferenceRoutingResolveService,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idParticipation/conferences/new',
    component: ConferenceUpdateComponent,
    resolve: {
      conference: ConferenceRoutingResolveService,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idParticipation/stands/:idStand/view',
    component: StandUpdateComponent,
    resolve: {
      conference: StandRoutingResolveService,
    },
    data: {
      readonly: true,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idParticipation/stands/:idStand/edit',
    component: StandUpdateComponent,
    resolve: {
      conference: StandRoutingResolveService,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':idParticipation/stands/new',
    component: StandUpdateComponent,
    resolve: {
      conference: StandRoutingResolveService,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ParticipationUpdateComponent,
    resolve: {
      participation: ParticipationResolve,
    },
    data: {
      readonly: false,
    },
    canActivate: [UserRouteAccessService],
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
