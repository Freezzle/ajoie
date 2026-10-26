import {Routes} from '@angular/router';

import {UserRouteAccessService} from 'app/core/auth/user-route-access.service';
import {ParticipationComponent} from './list/participation.component';
import {ParticipationUpdateComponent} from './update/participation-update.component';
import ParticipationResolve from './service/participation-routing-resolve.service';
import conferenceRoutes from '../conference/conference.routes';
import standRoutes from '../stand/stand.routes';
import workshopRoutes from '../workshop/workshop.routes';
import invoicingPlanRoutes from '../invoicing-plan/invoicing-plan.routes';

const participationRoute: Routes = [
    {
        path: '',
        component: ParticipationComponent,
        data: {},
        canActivate: [UserRouteAccessService]
    },
    {
        path: 'new',
        component: ParticipationUpdateComponent,
        resolve: {
            salon: ParticipationResolve
        },
        data: {
            readonly: false
        },
        canActivate: [UserRouteAccessService]
    },
    {
        path: ':idParticipation/invoicing-plans',
        children: invoicingPlanRoutes
    },
    {
        // L'écran de facturation d'une participation est devenu la liste des factures filtrée.
        path: ':idParticipation/billing',
        redirectTo: ':idParticipation/invoicing-plans',
        pathMatch: 'full'
    },
    {
        path: ':idParticipation/view',
        component: ParticipationUpdateComponent,
        resolve: {
            participation: ParticipationResolve
        },
        data: {
            readonly: true
        },
        canActivate: [UserRouteAccessService]
    },
    {
        path: ':idParticipation/conferences',
        children: conferenceRoutes
    },
    {
        path: ':idParticipation/workshops',
        children: workshopRoutes
    },
    {
        path: ':idParticipation/stands',
        children: standRoutes
    },
    {
        path: ':idParticipation/edit',
        component: ParticipationUpdateComponent,
        resolve: {
            participation: ParticipationResolve
        },
        data: {
            readonly: false
        },
        canActivate: [UserRouteAccessService]
    }
];

export default participationRoute;
