import {Routes} from '@angular/router';

const volunteerRegistrationRoutes: Routes = [
    {
        path: ':salonId',
        loadComponent: () => import('./volunteer-registration.component'),
        title: 'volunteerRegistration.title',
        data: {publicLayout: true}
    },
    {
        path: ':salonId/mon-inscription/:registrationId/:token',
        loadComponent: () => import('./manage/volunteer-registration-manage.component'),
        title: 'volunteerRegistration.manage.title',
        data: {publicLayout: true}
    }
];

export default volunteerRegistrationRoutes;
