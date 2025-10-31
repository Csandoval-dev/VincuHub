import { Routes } from '@angular/router';

export const routes: Routes = [
  // Redirige a inicio en lugar de login
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio').then(m => m.Inicio)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.Login)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro').then(m => m.Registro)
  },
  
  // Ruta 404
  { path: '**', redirectTo: 'inicio' }
];