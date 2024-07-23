import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'authority',
    data: { pageTitle: 'salonApp.adminAuthority.home.title' },
    loadChildren: () => import('./admin/authority/authority.routes'),
  },
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
    path: 'billing',
    data: { pageTitle: 'salonApp.billing.home.title' },
    loadChildren: () => import('./billing/billing.routes'),
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
    path: 'configuration-salon',
    data: { pageTitle: 'salonApp.configurationSalon.home.title' },
    loadChildren: () => import('./configuration-salon/configuration-salon.routes'),
  },
  {
    path: 'price-stand-salon',
    data: { pageTitle: 'salonApp.priceStandSalon.home.title' },
    loadChildren: () => import('./price-stand-salon/price-stand-salon.routes'),
  },
  /* jhipster-needle-add-entity-route - JHipster will add entity modules routes here */
];

export default routes;
