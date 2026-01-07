import {Routes} from '@angular/router';

import {UserRouteAccessService} from 'app/core/auth/user-route-access.service';
import {VolunteerPlanningComponent} from "./components/volunteer-planning.component";

const volunteerPlanningRoute: Routes = [
    {
        path: '',
        component: VolunteerPlanningComponent,
        data: {},
        canActivate: [UserRouteAccessService],
    }
];

export default volunteerPlanningRoute;
