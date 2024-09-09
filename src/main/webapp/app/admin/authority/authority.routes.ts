import {Routes} from '@angular/router';

import {UserRouteAccessService} from 'app/core/auth/user-route-access.service';
import {AuthorityComponent} from './list/authority.component';
import {AuthorityUpdateComponent} from './update/authority-update.component';
import AuthorityResolve from './route/authority-routing-resolve.service';
import SalonResolve from '../salon/route/salon-routing-resolve.service';

const authorityRoute: Routes = [
    {
        path: '',
        component: AuthorityComponent,
        data: {},
        canActivate: [UserRouteAccessService],
    },
    {
        path: ':name/view',
        component: AuthorityUpdateComponent,
        resolve: {
            authority: AuthorityResolve,
        },
        data: {
            readonly: true,
        },
        canActivate: [UserRouteAccessService],
    },
    {
        path: ':name/edit',
        component: AuthorityUpdateComponent,
        resolve: {
            salon: SalonResolve,
        },
        data: {
            readonly: false,
        },
        canActivate: [UserRouteAccessService],
    },
    {
        path: 'new',
        component: AuthorityUpdateComponent,
        resolve: {
            authority: AuthorityResolve,
        },
        data: {
            readonly: false,
        },
        canActivate: [UserRouteAccessService],
    },
];

export default authorityRoute;
