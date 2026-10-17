import {Routes} from '@angular/router';

const registrationRoutes: Routes = [
    {
        path: ':salonId',
        loadComponent: () => import('./registration.component'),
        title: 'registration.title',
        data: {publicLayout: true}
    },
    {
        path: ':salonId/modification/:participationId/:token',
        loadComponent: () => import('./registration.component'),
        title: 'registration.titleEdit',
        data: {publicLayout: true, editMode: true}
    }
];

export default registrationRoutes;
