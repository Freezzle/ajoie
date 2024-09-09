import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, ResolveFn, Routes} from '@angular/router';
import {of} from 'rxjs';

import {IUser} from './user-management.model';
import {UserManagementService} from './service/user-management.service';
import UserManagementComponent from './list/user-management.component';
import UserManagementUpdateComponent from './update/user-management-update.component';

export const UserManagementResolve: ResolveFn<IUser | null> = (route: ActivatedRouteSnapshot) => {
    const login = route.paramMap.get('login');
    if (login) {
        return inject(UserManagementService).find(login);
    }
    return of(null);
};

const userManagementRoute: Routes = [
    {
        path: '',
        component: UserManagementComponent,
        data: {
            defaultSort: 'id,asc',
        },
    },
    {
        path: ':login/view',
        component: UserManagementUpdateComponent,
        resolve: {
            user: UserManagementResolve,
        },
        data: {
            readonly: true,
        },
    },
    {
        path: 'new',
        component: UserManagementUpdateComponent,
        resolve: {
            user: UserManagementResolve,
        },
        data: {
            readonly: false,
        },
    },
    {
        path: ':login/edit',
        component: UserManagementUpdateComponent,
        resolve: {
            user: UserManagementResolve,
        },
        data: {
            readonly: false,
        },
    },
];

export default userManagementRoute;
