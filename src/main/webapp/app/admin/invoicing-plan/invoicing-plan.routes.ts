import {Routes} from '@angular/router';

import {UserRouteAccessService} from 'app/core/auth/user-route-access.service';
import {InvoicingPlanListComponent} from './list/invoicing-plan-list.component';

const invoicingPlanRoute: Routes = [
    {
        path: '',
        component: InvoicingPlanListComponent,
        data: {},
        canActivate: [UserRouteAccessService]
    }
];

export default invoicingPlanRoute;
