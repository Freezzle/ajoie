import {Routes} from '@angular/router';
import {Authority} from '../config/authority.constants';

const routes: Routes = [
    {
        path: 'user-management',
        data: {
            authorities: [Authority.ADMIN],
        },
        loadChildren: () => import('./user-management/user-management.route'),
        title: 'userManagement.home.title',
    },
    {
        path: 'authorities',
        data: {
            pageTitle: 'authority.home.title',
            authorities: [Authority.ADMIN],
        },
        loadChildren: () => import('./authority/authority.routes'),
    },
    {
        path: 'salons',
        data: {
            pageTitle: 'salon.title',
            authorities: [Authority.ADMIN_BUSINESS],
        },
        loadChildren: () => import('./salon/salon.routes'),
    },
    {
        path: 'exhibitors',
        data: {
            pageTitle: 'exhibitor.title',
            authorities: [Authority.ADMIN_BUSINESS],
        },
        loadChildren: () => import('./exhibitor/exhibitor.routes'),
    }
];

export default routes;
