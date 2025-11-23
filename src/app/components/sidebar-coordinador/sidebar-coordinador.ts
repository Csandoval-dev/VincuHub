// src/app/components/sidebar-coordinador/sidebar-coordinador.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models/user.model';

export type SeccionDashboard = 
  | 'dashboard' 
  | 'eventos-list' 
  | 'evento-create' 
  | 'asistencia' 
  | 'certificados' 
  | 'configuracion';

@Component({
  selector: 'app-sidebar-coordinador',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar">
      <!-- Header del sidebar -->
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <span class="logo-text">VincuHub</span>
        </div>
      </div>

      <!-- User info -->
      <div class="user-section">
        <div class="user-avatar">
          {{ getInitials() }}
        </div>
        <div class="user-info">
          <div class="user-name">{{ currentUser?.nombre }}</div>
          <div class="user-role">Coordinador</div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <button 
          class="nav-item"
          [class.active]="seccionActiva === 'dashboard'"
          (click)="cambiarSeccion('dashboard')">
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </span>
          <span class="nav-text">Dashboard</span>
        </button>

        <button 
          class="nav-item"
          [class.active]="seccionActiva === 'eventos-list'"
          (click)="cambiarSeccion('eventos-list')">
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </span>
          <span class="nav-text">Mis Eventos</span>
        </button>

        <button 
          class="nav-item primary"
          [class.active]="seccionActiva === 'evento-create'"
          (click)="cambiarSeccion('evento-create')">
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </span>
          <span class="nav-text">Crear Evento</span>
        </button>

        <button 
          class="nav-item"
          [class.active]="seccionActiva === 'asistencia'"
          (click)="cambiarSeccion('asistencia')">
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </span>
          <span class="nav-text">Gestión de Asistencia</span>
        </button>

        <button 
          class="nav-item"
          [class.active]="seccionActiva === 'certificados'"
          (click)="cambiarSeccion('certificados')">
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          </span>
          <span class="nav-text">Certificados</span>
        </button>

        <div class="nav-divider"></div>

        <button 
          class="nav-item"
          [class.active]="seccionActiva === 'configuracion'"
          (click)="cambiarSeccion('configuracion')">
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6m0 6v6m5.2-12.7l-4.2 4.2m0 4.2l-4.2 4.2m12.7-5.2l-6 0m-6 0l-6 0m12.7-5.2l-4.2 4.2m0 4.2l4.2 4.2"></path>
            </svg>
          </span>
          <span class="nav-text">Configuración</span>
        </button>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <button class="logout-btn" (click)="onLogout()">
          <span class="nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </span>
          <span class="nav-text">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 260px;
      height: 100vh;
      background: #ffffff;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
    }

    .sidebar-header {
      padding: 1.5rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #0066cc, #0052a3);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 1.25rem;
    }

    .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
    }

    .user-section {
      padding: 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0066cc, #0052a3);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1rem;
    }

    .user-info {
      flex: 1;
      overflow: hidden;
    }

    .user-name {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.95rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.75rem;
      overflow-y: auto;
    }

    .nav-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 0.25rem;
      text-align: left;
    }

    .nav-item:hover {
      background: #f3f4f6;
    }

    .nav-item.active {
      background: #eff6ff;
      color: #0066cc;
    }

    .nav-item.primary {
      background: #0066cc;
      color: white;
    }

    .nav-item.primary:hover {
      background: #0052a3;
    }

    .nav-item.primary.active {
      background: #0052a3;
    }

    .nav-icon {
      font-size: 1.25rem;
      width: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-text {
      font-size: 0.9rem;
      font-weight: 500;
    }

    .nav-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 1rem 0;
    }

    .sidebar-footer {
      padding: 1rem 0.75rem;
      border-top: 1px solid #e5e7eb;
    }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      color: #dc2626;
      text-align: left;
    }

    .logout-btn:hover {
      background: #fef2f2;
    }

    /* Scrollbar personalizado */
    .sidebar-nav::-webkit-scrollbar {
      width: 6px;
    }

    .sidebar-nav::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-nav::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 3px;
    }

    .sidebar-nav::-webkit-scrollbar-thumb:hover {
      background: #9ca3af;
    }
  `]
})
export class SidebarCoordinadorComponent {
  @Input() currentUser: User | null = null;
  @Input() seccionActiva: SeccionDashboard = 'dashboard';
  @Output() seccionChange = new EventEmitter<SeccionDashboard>();
  @Output() logout = new EventEmitter<void>();

  cambiarSeccion(seccion: SeccionDashboard) {
    this.seccionChange.emit(seccion);
  }

  onLogout() {
    this.logout.emit();
  }

  getInitials(): string {
    if (!this.currentUser?.nombre) return 'U';
    const nombres = this.currentUser.nombre.split(' ');
    return nombres.length > 1 
      ? nombres[0][0] + nombres[1][0]
      : nombres[0][0] + (this.currentUser.apellido?.[0] || '');
  }
}