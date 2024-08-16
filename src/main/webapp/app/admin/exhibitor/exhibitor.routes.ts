import{Routes}from'@angular/router';

import {UserRouteAccessService} from 'app/core/auth/user-route-access.service';
import { ExhibitorComponent}from './list/exhibitor.component';
import {ExhibitorDetailComponent}from './detail/exhibitor-detail.component';
import {ExhibitorUpdateComponent}from './update/exhibitor-update.component';
import ExhibitorResolve from './route/exhibitor-routing-resolve.service';

const exhibitorRoute: Routes = [
{
path: '',
component: ExhibitorComponent,
data: {

},
canActivate: [UserRouteAccessService],
},
{
path: ':id/view',
component: ExhibitorDetailComponent,
resolve: {
exhibitor: ExhibitorResolve,
},
canActivate: [UserRouteAccessService],
},
{
path: 'new',
component: ExhibitorUpdateComponent,
resolve: {
exhibitor: ExhibitorResolve,
},
canActivate: [UserRouteAccessService],
},
{
path: ':id/edit',
component: ExhibitorUpdateComponent,
resolve: {
exhibitor: ExhibitorResolve,
},
canActivate: [UserRouteAccessService],
},
];

export default exhibitorRoute;
