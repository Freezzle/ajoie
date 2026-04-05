import {Routes} from '@angular/router';
import {UserRouteAccessService} from 'app/core/auth/user-route-access.service';
import {TaskFocusListComponent} from './list/task-focus-list.component';

const taskRoutes: Routes = [
    {
        path: '',
        component: TaskFocusListComponent,
        data: {},
        canActivate: [UserRouteAccessService]
    }
];

export default taskRoutes;
