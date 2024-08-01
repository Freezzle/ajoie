import { Routes } from '@angular/router';
/* jhipster-needle-add-admin-module-import - JHipster will add admin modules imports here */

const routes: Routes = [
  {
    path: 'user-management',
    loadChildren: () => import('./user-management/user-management.route'),
    title: 'userManagement.home.title',
  },
  {
    path: 'docs',
    loadComponent: () => import('./docs/docs.component'),
    title: 'global.menu.admin.apidocs',
  },
  {
    path: 'authorities',
    data: { pageTitle: 'salonApp.adminAuthority.home.title' },
    loadChildren: () => import('./authority/authority.routes'),
  },
  {
    path: 'salons',
    data: { pageTitle: 'salon.title' },
    loadChildren: () => import('./salon/salon.routes'),
  },
  {
    path: 'stands',
    data: { pageTitle: 'salon.title' },
    loadChildren: () => import('./stand/stand.routes'),
  },
  /* jhipster-needle-add-admin-route - JHipster will add admin routes here */
];

export default routes;
