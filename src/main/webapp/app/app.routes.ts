import {Routes} from '@angular/router';

import {Authority} from 'app/config/authority.constants';
import {UserRouteAccessService} from 'app/core/auth/user-route-access.service';
import {errorRoute} from './layouts/error/error.route';

import LandingPageComponent from './landing/landing-page/landing-page.component';
import NavbarComponent from './layouts/navbar/navbar.component';
import LoginComponent from './login/login.component';

const routes: Routes = [
    {
        path: '',
        component: LandingPageComponent,
        title: 'home.title',
        data: {publicLayout: true}
    },
    {
        path: '',
        component: NavbarComponent,
        outlet: 'navbar'
    },
    {
        path: 'admin',
        data: {
            authorities: [Authority.ADMIN, Authority.ADMIN_BUSINESS]
        },
        canActivate: [UserRouteAccessService],
        loadChildren: () => import('./admin/admin.routes')
    },
    {
        path: 'account',
        loadChildren: () => import('./account/account.route')
    },
    {
        path: 'admin/login',
        component: LoginComponent,
        title: 'login.title'
    },
    {
        path: 'inscription',
        loadChildren: () => import('./registration/registration.routes')
    },
    ...errorRoute
];

export default routes;
