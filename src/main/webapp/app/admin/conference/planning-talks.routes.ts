import {Routes} from '@angular/router';

import {UserRouteAccessService} from 'app/core/auth/user-route-access.service';
import {PlanningTalksComponent} from "./planning/planning-talks.component";

const planningTalksRoute: Routes = [
    {
        path: '',
        component: PlanningTalksComponent,
        canActivate: [UserRouteAccessService],
    },
];

export default planningTalksRoute;
