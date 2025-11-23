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
          <div class="logo-icon">C</div>
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
          <span class="nav-icon">📊</span>
          <span class="nav-text">Dashboard</span>
        </button>

        <button 
          class="nav-item"
          [class.active]="seccionActiva === 'eventos-list'"
          (click)="cambiarSeccion('eventos-list')">
          <span class="nav-icon">📅</span>
          <span class="nav-text">Mis Eventos</span>
        </button>

        <button 
          class="nav-item primary"
          [class.active]="seccionActiva === 'evento-create'"
          (click)="cambiarSeccion('evento-create')">
          <span class="nav-icon">➕</span>
          <span class="nav-text">Crear Evento</span>
        </button>

        <button 
          class="nav-item"
          [class.active]="seccionActiva === 'asistencia'"
          (click)="cambiarSeccion('asistencia')">
          <span class="nav-icon">✅</span>
          <span class="nav-text">Gestión de Asistencia</span>
        </button>

        <button 
          class="nav-item"
          [class.active]="seccionActiva === 'certificados'"
          (click)="cambiarSeccion('certificados')">
          <span class="nav-icon">📜</span>
          <span class="nav-text">Certificados</span>
        </button>

        <div class="nav-divider"></div>

        <button 
          class="nav-item"
          [class.active]="seccionActiva === 'configuracion'"
          (click)="cambiarSeccion('configuracion')">
          <span class="nav-icon">⚙️</span>
          <span class="nav-text">Configuración</span>
        </button>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <button class="logout-btn" (click)="onLogout()">
          <span class="nav-icon">🚪</span>
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