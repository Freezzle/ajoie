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
  {
    path: 'stand',
    data: { pageTitle: 'salonApp.stand.home.title' },
    loadChildren: () => import('./stand/stand.routes'),
  },
  {
    path: 'invoice',
    data: { pageTitle: 'salonApp.invoice.home.title' },
    loadChildren: () => import('./invoice/invoice.routes'),
  },
  {
    path: 'salon',
    data: { pageTitle: 'salonApp.salon.home.title' },
    loadChildren: () => import('./salon/salon.routes'),
  },
  {
    path: 'conference',
    data: { pageTitle: 'salonApp.conference.home.title' },
    loadChildren: () => import('./conference/conference.routes'),
  },
  {
    path: 'price-stand-salon',
    data: { pageTitle: 'salonApp.priceStandSalon.home.title' },
    loadChildren: () => import('./price-stand-salon/price-stand-salon.routes'),
  },
  {
    path: 'participation',
    data: { pageTitle: 'salonApp.participation.home.title' },
    loadChildren: () => import('./participation/participation.routes'),
  },
  {
    path: 'payment',
    data: { pageTitle: 'salonApp.payment.home.title' },
    loadChildren: () => import('./payment/payment.routes'),
  },
  /* jhipster-needle-add-entity-route - JHipster will add entity modules routes here */
];

export default routes;
