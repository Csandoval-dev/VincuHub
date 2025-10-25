import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro').then(m => m.Registro)
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio').then(m => m.Inicio)
  },
];
