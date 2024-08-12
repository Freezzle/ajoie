import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'exponent',
    data: { pageTitle: 'salonApp.exponent.home.title' },
    loadChildren: () => import('./exponent/exponent.routes'),
  },
  {
    path: 'dimension-stand',
    data: { pageTitle: 'salonApp.dimensionStand.home.title' },
    loadChildren: () => import('./dimension-stand/dimension-stand.routes'),
  },
  /* jhipster-needle-add-entity-route - JHipster will add entity modules routes here */
];

export default routes;
