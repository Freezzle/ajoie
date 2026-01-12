import {Routes} from '@angular/router';
import {UserRouteAccessService} from '../../core/auth/user-route-access.service';
import {FloorPlanDetailComponent} from './detail/floor-plan-detail.component';


const floorPlanRoutes: Routes = [
    {
        path: '',
        component: FloorPlanDetailComponent,
        data: {},
        canActivate: [UserRouteAccessService]
    }
];

export default floorPlanRoutes;
