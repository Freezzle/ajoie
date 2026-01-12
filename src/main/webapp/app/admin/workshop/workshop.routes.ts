import {Routes} from '@angular/router';

import {UserRouteAccessService} from 'app/core/auth/user-route-access.service';
import {WorkshopComponent} from './list/workshop.component';
import {WorkshopUpdateComponent} from './update/workshop-update.component';
import WorkshopResolve from './service/workshop-routing-resolve.service';

const workshopRoute: Routes = [
    {
        path: '',
        component: WorkshopComponent,
        data: {},
        canActivate: [UserRouteAccessService]
    },
    {
        path: ':idWorkshop/view',
        component: WorkshopUpdateComponent,
        resolve: {
            workshop: WorkshopResolve
        },
        data: {
            readonly: true
        },
        canActivate: [UserRouteAccessService]
    },
    {
        path: 'new',
        component: WorkshopUpdateComponent,
        resolve: {
            workshop: WorkshopResolve
        },
        data: {
            readonly: false
        },
        canActivate: [UserRouteAccessService]
    },
    {
        path: ':idWorkshop/edit',
        component: WorkshopUpdateComponent,
        resolve: {
            workshop: WorkshopResolve
        },
        data: {
            readonly: false
        },
        canActivate: [UserRouteAccessService]
    }
];

export default workshopRoute;
