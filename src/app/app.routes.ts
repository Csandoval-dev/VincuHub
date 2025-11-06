// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { 
    path: '', 
    redirectTo: 'inicio', 
    pathMatch: 'full' 
  },
  
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

  // Dashboard Estudiante (protegido por auth + rol estudiante)
  {
    path: 'dashboard-alumno',
    loadComponent: () => import('./pages/dashboard-alumno/dashboard-alumno').then(m => m.DashboardAlumnoComponent),
    canActivate: [authGuard, roleGuard(['estudiante'])]
  },

  // Dashboard Coordinador (protegido por auth + rol coordinador)
  {
    path: 'dashboard-coordinador',
    loadComponent: () => import('./pages/dashboard-coordinador/dashboard-coordinador').then(m => m.DashboardCoordinadorComponent),
    canActivate: [authGuard, roleGuard(['coordinador'])]
  },

  // Dashboard Admin (protegido por auth + rol admin)
  {
    path: 'dashboard-admin',
    loadComponent: () => import('./pages/dashboard-admin/dashboard-admin').then(m => m.DashboardAdminComponent),
    canActivate: [authGuard, roleGuard(['admin'])]
  },

  // Ruta 404
  {
    path: '**',
    redirectTo: 'inicio'
  }
];