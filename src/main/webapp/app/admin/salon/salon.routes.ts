import {Routes} from '@angular/router';

import {UserRouteAccessService} from 'app/core/auth/user-route-access.service';
import {SalonComponent} from './list/salon.component';
import {SalonStatsComponent} from './stats/salon-stats.component';
import {SalonUpdateComponent} from './update/salon-update.component';
import SalonResolve from './service/salon-routing-resolve.service';
import conferenceRoutes from '../conference/conference.routes';
import standRoutes from '../stand/stand.routes';
import participationRoutes from '../participation/participation.routes';
import floorPlanRoutes from '../floor-plan/floor-plan.routes';
import workshopRoutes from "../workshop/workshop.routes";
import talksPlanningRoute from "../talk-planning/talks-planning.routes";
import {Authority} from "../../config/authority.constants";
import volunteersPlanningRoute from "../volunteer-planning/volunteer-planning.routes";

const salonRoute: Routes = [
    {
        path: '',
        component: SalonComponent,
        data: {},
        canActivate: [UserRouteAccessService],
    },
    {
        path: ':idSalon/stats',
        component: SalonStatsComponent,
        resolve: {
            salon: SalonResolve,
        },
        canActivate: [UserRouteAccessService],
    },
    {
        path: ':idSalon/view',
        component: SalonUpdateComponent,
        resolve: {
            salon: SalonResolve,
        },
        data: {
            readonly: true,
        },
        canActivate: [UserRouteAccessService],
    },
    {
        path: 'new',
        component: SalonUpdateComponent,
        resolve: {
            salon: SalonResolve,
        },
        data: {
            readonly: false,
        },
        canActivate: [UserRouteAccessService],
    },
    {
        path: ':idSalon/edit',
        component: SalonUpdateComponent,
        resolve: {
            salon: SalonResolve,
        },
        data: {
            readonly: false,
        },
        canActivate: [UserRouteAccessService],
    },
    {
        path: ':idSalon/conferences',
        children: conferenceRoutes,
    },
    {
        path: ':idSalon/workshops',
        children: workshopRoutes,
    },
    {
        path: ':idSalon/stands',
        children: standRoutes,
    },
    {
        path: ':idSalon/participations',
        children: participationRoutes,
    },
    {
        path: ':idSalon/talks-planning',
        children: talksPlanningRoute
    },
    {
        path: ':idSalon/volunteers-planning',
        children: volunteersPlanningRoute
    },
    {
        path: ':idSalon/floor-plan',
        resolve: {
            salon: SalonResolve,
        },
        children: floorPlanRoutes,
    }
];

export default salonRoute;
