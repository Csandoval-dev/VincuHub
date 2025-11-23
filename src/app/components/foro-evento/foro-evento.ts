// src/app/components/foro-evento/foro-evento.component.ts

import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventosService } from '../../services/eventos.service';
import { ForosService } from '../../services/foros.service';
import { AuthService } from '../../services/auth.service';
import { Evento } from '../../models/evento.model';
import { Foro, MensajeForo } from '../../models/foro.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-foro-evento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="foro-container">
      
      <!-- Selección de evento -->
      <div class="evento-selector">
        <h3>Selecciona un Evento para ver su Foro</h3>
        <select 
          [(ngModel)]="eventoSeleccionadoId"
          (change)="onEventoChange()"
          class="evento-select">
          <option value="">-- Seleccionar evento --</option>
          <option *ngFor="let evento of eventos" [value]="evento.eventoId">
            {{ evento.titulo }}
          </option>
        </select>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando foro...</p>
      </div>

      <!-- Foro content -->
      <div *ngIf="!loading && foro && eventoSeleccionado" class="foro-content">
        
        <!-- Header del foro -->
        <div class="foro-header">
          <div class="foro-info">
            <h2>{{ eventoSeleccionado.titulo }}</h2>
            <p class="foro-desc">{{ foro.descripcion }}</p>
            <div class="foro-stats">
              <span>💬 {{ mensajes.length }} mensajes</span>
              <span *ngIf="foro.cerrado" class="badge-cerrado">🔒 Foro Cerrado</span>
            </div>
          </div>
          <button 
            *ngIf="esCoordinador"
            class="btn-cerrar"
            (click)="toggleCerrarForo()"
            [disabled]="guardando">
            {{ foro.cerrado ? '🔓 Abrir Foro' : '🔒 Cerrar Foro' }}
          </button>
        </div>

        <!-- Lista de mensajes -->
        <div class="mensajes-lista">
          <div *ngIf="mensajes.length === 0" class="empty-mensajes">
            <div class="empty-icon">💬</div>
            <p>Aún no hay mensajes en este foro</p>
            <p class="empty-hint">Sé el primero en comentar</p>
          </div>

          <div *ngFor="let mensaje of mensajes" class="mensaje-card">
            <div class="mensaje-avatar">
              {{ getInitials(mensaje.nombreUsuario || '') }}
            </div>
            <div class="mensaje-content">
              <div class="mensaje-header">
                <div class="mensaje-autor">
                  <span class="autor-nombre">{{ mensaje.nombreUsuario }}</span>
                  <span class="autor-rol" [class]="'rol-' + mensaje.rolUsuario">
                    {{ getRolLabel(mensaje.rolUsuario || '') }}
                  </span>
                </div>
                <div class="mensaje-acciones">
                  <span class="mensaje-fecha">
                    {{ mensaje.fecha | date: 'dd/MM/yyyy HH:mm' }}
                  </span>
                  <button 
                    *ngIf="esCoordinador && !mensaje.eliminado"
                    class="btn-eliminar"
                    (click)="eliminarMensaje(mensaje)"
                    title="Eliminar mensaje">
                    🗑️
                  </button>
                </div>
              </div>
              <p class="mensaje-texto" [class.mensaje-eliminado]="mensaje.eliminado">
                {{ mensaje.contenido }}
              </p>
            </div>
          </div>
        </div>

        <!-- Formulario de nuevo mensaje -->
        <div *ngIf="!foro.cerrado" class="nuevo-mensaje-form">
          <div class="form-avatar">
            {{ getInitials(currentUser?.nombre || '') }}
          </div>
          <div class="form-input-group">
            <textarea
              [(ngModel)]="nuevoMensaje"
              placeholder="Escribe tu comentario..."
              rows="3"
              class="mensaje-input"
              [disabled]="enviandoMensaje"></textarea>
            <div class="form-actions">
              <button 
                class="btn-enviar"
                (click)="enviarMensaje()"
                [disabled]="!nuevoMensaje.trim() || enviandoMensaje">
                {{ enviandoMensaje ? 'Enviando...' : '📤 Enviar Comentario' }}
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="foro.cerrado" class="foro-cerrado-msg">
          🔒 Este foro ha sido cerrado y no se permiten nuevos comentarios
        </div>
      </div>

      <!-- Sin evento seleccionado -->
      <div *ngIf="!loading && !eventoSeleccionado" class="empty-state">
        <div class="empty-icon">💬</div>
        <h3>Selecciona un Evento</h3>
        <p>Elige un evento para ver y participar en su foro de discusión</p>
      </div>

      <!-- Mensajes de alerta -->
      <div *ngIf="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>
    </div>
  `,
  styles: [`
    .foro-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .evento-selector {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1.125rem;
        color: #111827;
      }
    }

    .evento-select {
      width: 100%;
      padding: 0.875rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.95rem;
      cursor: pointer;

      &:focus {
        outline: none;
        border-color: #0066cc;
      }
    }

    .loading-state, .empty-state {
      background: white;
      padding: 4rem 2rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top-color: #0066cc;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .foro-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .foro-header {
      background: linear-gradient(135deg, #0066cc, #0052a3);
      color: white;
      padding: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .foro-info {
      flex: 1;

      h2 {
        margin: 0 0 0.5rem 0;
        font-size: 1.5rem;
      }
    }

    .foro-desc {
      margin: 0 0 1rem 0;
      opacity: 0.9;
      font-size: 0.95rem;
    }

    .foro-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.9rem;
      opacity: 0.95;
    }

    .badge-cerrado {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-weight: 600;
    }

    .btn-cerrar {
      padding: 0.75rem 1.5rem;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .mensajes-lista {
      padding: 2rem;
      max-height: 600px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .empty-mensajes {
      text-align: center;
      padding: 3rem 1rem;
      color: #6b7280;

      .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      p {
        margin: 0.5rem 0;
      }

      .empty-hint {
        font-size: 0.9rem;
      }
    }

    .mensaje-card {
      display: flex;
      gap: 1rem;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .mensaje-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0066cc, #0052a3);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .mensaje-content {
      flex: 1;
      background: #f9fafb;
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }

    .mensaje-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .mensaje-autor {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .autor-nombre {
      font-weight: 600;
      color: #111827;
    }

    .autor-rol {
      padding: 0.25rem 0.625rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;

      &.rol-estudiante {
        background: #dbeafe;
        color: #1e40af;
      }

      &.rol-coordinador {
        background: #fef3c7;
        color: #92400e;
      }

      &.rol-admin {
        background: #fee2e2;
        color: #991b1b;
      }
    }

    .mensaje-acciones {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .mensaje-fecha {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .btn-eliminar {
      background: transparent;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.2s;

      &:hover {
        opacity: 1;
      }
    }

    .mensaje-texto {
      margin: 0;
      color: #374151;
      line-height: 1.6;
      white-space: pre-wrap;
      word-break: break-word;

      &.mensaje-eliminado {
        font-style: italic;
        color: #9ca3af;
      }
    }

    .nuevo-mensaje-form {
      padding: 1.5rem 2rem 2rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 1rem;
    }

    .form-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0066cc, #0052a3);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .form-input-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .mensaje-input {
      width: 100%;
      padding: 0.875rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.95rem;
      font-family: inherit;
      resize: vertical;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #0066cc;
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
      }

      &:disabled {
        background: #f3f4f6;
        cursor: not-allowed;
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
    }

    .btn-enviar {
      padding: 0.75rem 1.5rem;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: #0052a3;
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .foro-cerrado-msg {
      padding: 1.5rem 2rem;
      background: #fef3c7;
      color: #92400e;
      text-align: center;
      font-weight: 600;
      border-top: 1px solid #fcd34d;
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.9rem;

      &.alert-success {
        background: #f0fdf4;
        color: #166534;
        border: 1px solid #bbf7d0;
      }

      &.alert-error {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }
    }

    @media (max-width: 768px) {
      .foro-header {
        flex-direction: column;
        gap: 1rem;
      }

      .btn-cerrar {
        width: 100%;
      }

      .nuevo-mensaje-form {
        flex-direction: column;
        align-items: center;
      }

      .form-input-group {
        width: 100%;
      }
    }
  `]
})
export class ForoEventoComponent implements OnInit {
  @Input() coordinadorUid: string = '';

  private eventosService = inject(EventosService);
  private forosService = inject(ForosService);
  private authService = inject(AuthService);

  eventos: Evento[] = [];
  eventoSeleccionadoId: string = '';
  eventoSeleccionado: Evento | null = null;
  foro: Foro | null = null;
  mensajes: MensajeForo[] = [];
  currentUser: User | null = null;
  nuevoMensaje = '';
  
  loading = false;
  enviandoMensaje = false;
  guardando = false;
  esCoordinador = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.esCoordinador = user?.rol === 'coordinador' || user?.rol === 'admin';
    });

    this.cargarEventos();
  }

  cargarEventos() {
    this.eventosService.getEventosByCoordinador(this.coordinadorUid).subscribe({
      next: (eventos) => {
        this.eventos = eventos.filter(e => e.estado !== 'cancelado');
      },
      error: (error) => {
        console.error('Error cargando eventos:', error);
      }
    });
  }

  async onEventoChange() {
    if (!this.eventoSeleccionadoId) {
      this.eventoSeleccionado = null;
      this.foro = null;
      this.mensajes = [];
      return;
    }

    this.eventoSeleccionado = this.eventos.find(e => e.eventoId === this.eventoSeleccionadoId) || null;
    await this.cargarForo();
  }

  async cargarForo() {
    this.loading = true;
    try {
      this.foro = await this.forosService.getForoByEvento(this.eventoSeleccionadoId);
      
      if (this.foro) {
        this.cargarMensajes();
      } else {
        this.errorMessage = 'No se encontró el foro para este evento';
        this.loading = false;
      }
    } catch (error) {
      console.error('Error cargando foro:', error);
      this.errorMessage = 'Error al cargar el foro';
      this.loading = false;
    }
  }

  cargarMensajes() {
    if (!this.foro) return;

    this.forosService.getMensajesByForo(this.foro.foroId!).subscribe({
      next: (mensajes) => {
        this.mensajes = mensajes;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando mensajes:', error);
        this.loading = false;
      }
    });
  }

  async enviarMensaje() {
    if (!this.nuevoMensaje.trim() || !this.foro) return;

    this.enviandoMensaje = true;
    this.errorMessage = '';

    try {
      await this.forosService.agregarMensaje(this.foro.foroId!, {
        contenido: this.nuevoMensaje.trim()
      });

      this.nuevoMensaje = '';
      this.successMessage = 'Mensaje enviado';
      setTimeout(() => this.successMessage = '', 2000);
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      this.errorMessage = error.message || 'Error al enviar el mensaje';
    } finally {
      this.enviandoMensaje = false;
    }
  }

  async eliminarMensaje(mensaje: MensajeForo) {
    if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;

    try {
      await this.forosService.eliminarMensaje(mensaje.foroId, mensaje.mensajeId!);
      this.successMessage = 'Mensaje eliminado';
      setTimeout(() => this.successMessage = '', 2000);
    } catch (error: any) {
      console.error('Error eliminando mensaje:', error);
      this.errorMessage = error.message || 'Error al eliminar el mensaje';
    }
  }

  async toggleCerrarForo() {
    if (!this.foro) return;

    this.guardando = true;
    try {
      await this.forosService.cerrarForo(this.foro.foroId!);
      this.foro.cerrado = !this.foro.cerrado;
      this.successMessage = this.foro.cerrado ? 'Foro cerrado' : 'Foro abierto';
      setTimeout(() => this.successMessage = '', 2000);
    } catch (error: any) {
      console.error('Error:', error);
      this.errorMessage = error.message || 'Error al actualizar el foro';
    } finally {
      this.guardando = false;
    }
  }

  getInitials(nombre: string): string {
    const nombres = nombre.trim().split(' ');
    return nombres.length > 1 
      ? nombres[0][0] + nombres[1][0]
      : nombres[0][0];
  }

  getRolLabel(rol: string): string {
    const labels: any = {
      'estudiante': 'Estudiante',
      'coordinador': 'Coordinador',
      'admin': 'Admin'
    };
    return labels[rol] || rol;
  }
}