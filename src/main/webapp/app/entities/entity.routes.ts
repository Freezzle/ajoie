import {Routes} from '@angular/router';

const routes: Routes = [
    {
        path: 'exhibitor',
        data: {
            pageTitle: 'salonApp.exhibitor.home.title'
        },
        loadChildren: () => import('./exhibitor/exhibitor.routes'),
    },
    {
        path: 'dimension-stand',
        data: {pageTitle: 'salonApp.dimensionStand.home.title'},
        loadChildren: () => import('./dimension-stand/dimension-stand.routes'),
    },
    /* jhipster-needle-add-entity-route - JHipster will add entity modules routes here */
];

export default routes;
