import {Routes} from '@angular/router';

import {UserRouteAccessService} from 'app/core/auth/user-route-access.service';
import {VolunteerPlanningComponent} from './plan/volunteer-planning.component';

const volunteerRoute: Routes = [
    {
        path: '',
        component: VolunteerPlanningComponent,
        canActivate: [UserRouteAccessService],
    },
];

export default volunteerRoute;
