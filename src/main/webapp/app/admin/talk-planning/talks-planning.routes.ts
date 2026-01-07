import {Routes} from '@angular/router';

import {UserRouteAccessService} from 'app/core/auth/user-route-access.service';
import {TalksPlanningComponent} from "./components/talks-planning.component";

const planningTalksRoute: Routes = [
    {
        path: '',
        component: TalksPlanningComponent,
        canActivate: [UserRouteAccessService],
    },
];

export default planningTalksRoute;
