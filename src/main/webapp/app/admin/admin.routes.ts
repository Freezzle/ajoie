import { Routes } from '@angular/router';
import { Authority } from '../config/authority.constants';
/* jhipster-needle-add-admin-module-import - JHipster will add admin modules imports here */

const routes: Routes = [
  {
    path: 'user-management',
    data: {
      authorities: [Authority.ADMIN],
    },
    loadChildren: () => import('./user-management/user-management.route'),
    title: 'userManagement.home.title',
  },
  {
    path: 'docs',
    data: {
      authorities: [Authority.ADMIN],
    },
    loadComponent: () => import('./docs/docs.component'),
    title: 'global.menu.admin.apidocs',
  },
  {
    path: 'authorities',
    data: {
      pageTitle: 'authority.home.title',
      authorities: [Authority.ADMIN],
    },
    loadChildren: () => import('./authority/authority.routes'),
  },
  {
    path: 'salons',
    data: {
      pageTitle: 'salon.title',
      authorities: [Authority.ADMIN_BUSINESS],
    },
    loadChildren: () => import('./salon/salon.routes'),
  },
  {
    path: 'exhibitors',
    data: {
      pageTitle: 'exhibitor.title',
      authorities: [Authority.ADMIN_BUSINESS],
    },
    loadChildren: () => import('./exhibitor/exhibitor.routes'),
  },
  {
    path: 'stands',
    data: {
      pageTitle: 'salon.title',
      authorities: [Authority.ADMIN_BUSINESS],
    },
    loadChildren: () => import('./stand/stand.routes'),
  },
  {
    path: 'conferences',
    data: {
      pageTitle: 'conference.title',
      authorities: [Authority.ADMIN_BUSINESS],
    },
    loadChildren: () => import('./conference/conference.routes'),
  },
  {
    path: 'participations',
    data: {
      pageTitle: 'participation.title',
      authorities: [Authority.ADMIN_BUSINESS],
    },
    loadChildren: () => import('./participation/participation.routes'),
  },
  {
    path: 'volunteers',
    data: {
      pageTitle: 'volunteer.title',
      authorities: [Authority.ADMIN_BUSINESS],
    },
    loadChildren: () => import('./volunteer/volunteer.routes'),
  },
  /* jhipster-needle-add-admin-route - JHipster will add admin routes here */
];

export default routes;
