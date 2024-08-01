import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ParticipationComponent } from './list/participation.component';
import { ParticipationDetailComponent } from './detail/participation-detail.component';
import { ParticipationUpdateComponent } from './update/participation-update.component';
import ParticipationResolve from './route/participation-routing-resolve.service';

const participationRoute: Routes = [
  {
    path: '',
    component: ParticipationComponent,
    data: {},
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    component: ParticipationDetailComponent,
    resolve: {
      participation: ParticipationResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    component: ParticipationUpdateComponent,
    resolve: {
      participation: ParticipationResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    component: ParticipationUpdateComponent,
    resolve: {
      participation: ParticipationResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default participationRoute;
