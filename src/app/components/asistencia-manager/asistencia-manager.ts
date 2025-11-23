// src/app/components/asistencia-manager/asistencia-manager.component.ts

import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventosService } from '../../services/eventos.service';
import { InscripcionesService } from '../../services/inscripciones.service';
import { Evento } from '../../models/evento.model';
import { Inscripcion, UpdateAsistenciaData } from '../../models/inscripcion.model';

interface AsistenciaRow extends Inscripcion {
  _checked?: boolean;
  _horas?: number;
  _comentarios?: string;
}

@Component({
  selector: 'app-asistencia-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="asistencia-container">
      
      <!-- Selección de evento -->
      <div class="evento-selector">
        <h3>Selecciona un Evento</h3>
        <select 
          [(ngModel)]="eventoSeleccionadoId"
          (change)="onEventoChange()"
          class="evento-select">
          <option value="">-- Seleccionar evento --</option>
          <option *ngFor="let evento of eventos" [value]="evento.eventoId">
            {{ evento.titulo }} ({{ evento.fecha | date: 'dd/MM/yyyy' }})
          </option>
        </select>
      </div>

      <!-- Información del evento -->
      <div *ngIf="eventoSeleccionado" class="evento-info-card">
        <div class="info-header">
          <h4>{{ eventoSeleccionado.titulo }}</h4>
          <span class="inscritos-badge">
            {{ inscripciones.length }} inscritos
          </span>
        </div>
        <div class="info-details">
          <span>📅 {{ eventoSeleccionado.fecha | date: 'dd/MM/yyyy' }}</span>
          <span>📍 {{ eventoSeleccionado.ubicacion }}</span>
          <span>🏢 {{ eventoSeleccionado.campus }}</span>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando inscripciones...</p>
      </div>

      <!-- Sin inscripciones -->
      <div *ngIf="!loading && eventoSeleccionado && inscripciones.length === 0" class="empty-state">
        <div class="empty-icon">👥</div>
        <h3>No hay inscripciones</h3>
        <p>Aún no hay estudiantes inscritos en este evento</p>
      </div>

      <!-- Tabla de asistencia -->
      <div *ngIf="!loading && inscripciones.length > 0" class="asistencia-section">
        
        <!-- Acciones masivas -->
        <div class="actions-bar">
          <div class="selection-info">
            <span>{{ getSeleccionados().length }} seleccionados</span>
          </div>
          <div class="action-buttons">
            <button 
              class="btn-action"
              (click)="marcarTodosAsistencia(true)"
              [disabled]="guardando">
              ✅ Marcar Todos
            </button>
            <button 
              class="btn-action"
              (click)="marcarTodosAsistencia(false)"
              [disabled]="guardando">
              ❌ Desmarcar Todos
            </button>
            <button 
              class="btn-primary"
              (click)="guardarAsistencias()"
              [disabled]="guardando || getSeleccionados().length === 0">
              {{ guardando ? 'Guardando...' : '💾 Guardar Asistencias' }}
            </button>
          </div>
        </div>

        <!-- Tabla -->
        <div class="table-container">
          <table class="asistencia-table">
            <thead>
              <tr>
                <th class="check-col">
                  <input 
                    type="checkbox"
                    [checked]="todosSeleccionados()"
                    (change)="toggleTodos($event)"
                    class="checkbox">
                </th>
                <th>Estudiante</th>
                <th>Carrera</th>
                <th>Correo</th>
                <th>Horas a Otorgar</th>
                <th>Comentarios</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let inscripcion of inscripciones" class="table-row">
                <td class="check-col">
                  <input 
                    type="checkbox"
                    [(ngModel)]="inscripcion._checked"
                    class="checkbox">
                </td>
                <td>
                  <div class="estudiante-info">
                    <div class="estudiante-avatar">
                      {{ getInitials(inscripcion.nombreEstudiante || '') }}
                    </div>
                    <div class="estudiante-nombre">
                      {{ inscripcion.nombreEstudiante }}
                    </div>
                  </div>
                </td>
                <td>
                  <span class="carrera-badge">{{ inscripcion.carrera }}</span>
                </td>
                <td class="correo-col">{{ inscripcion.correoEstudiante }}</td>
                <td>
                  <input 
                    type="number"
                    [(ngModel)]="inscripcion._horas"
                    min="0"
                    max="24"
                    step="0.5"
                    class="horas-input"
                    [disabled]="!inscripcion._checked">
                </td>
                <td>
                  <input 
                    type="text"
                    [(ngModel)]="inscripcion._comentarios"
                    placeholder="Comentarios opcionales"
                    class="comentarios-input"
                    [disabled]="!inscripcion._checked">
                </td>
                <td>
                  <span 
                    class="status-badge"
                    [class.status-presente]="inscripcion.asistencia"
                    [class.status-ausente]="!inscripcion.asistencia">
                    {{ inscripcion.asistencia ? '✅ Asistió' : '⏳ Pendiente' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Mensajes -->
      <div *ngIf="successMessage" class="alert alert-success">
        {{ successMessage }}
      </div>
      <div *ngIf="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>
    </div>
  `,
  styles: [`
    .asistencia-container {
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

    .evento-info-card {
      background: linear-gradient(135deg, #0066cc, #0052a3);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 102, 204, 0.2);
    }

    .info-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h4 {
        margin: 0;
        font-size: 1.25rem;
      }
    }

    .inscritos-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .info-details {
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
      font-size: 0.9rem;
      opacity: 0.95;
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

    .asistencia-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .selection-info {
      font-weight: 600;
      color: #374151;
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
    }

    .btn-action,
    .btn-primary {
      padding: 0.625rem 1.25rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-action {
      background: white;
      border: 2px solid #e5e7eb;
      color: #374151;

      &:hover:not(:disabled) {
        border-color: #0066cc;
        color: #0066cc;
      }
    }

    .btn-primary {
      background: #0066cc;
      color: white;

      &:hover:not(:disabled) {
        background: #0052a3;
        transform: translateY(-1px);
      }
    }

    .table-container {
      overflow-x: auto;
    }

    .asistencia-table {
      width: 100%;
      border-collapse: collapse;

      thead {
        background: #f9fafb;
        border-bottom: 2px solid #e5e7eb;
      }

      th {
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        font-size: 0.85rem;
        color: #6b7280;
        text-transform: uppercase;
      }

      td {
        padding: 1rem;
        border-bottom: 1px solid #e5e7eb;
      }
    }

    .table-row {
      transition: background 0.2s;

      &:hover {
        background: #f9fafb;
      }
    }

    .check-col {
      width: 50px;
      text-align: center;
    }

    .checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .estudiante-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .estudiante-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0066cc, #0052a3);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .estudiante-nombre {
      font-weight: 600;
      color: #111827;
    }

    .carrera-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      background: #eff6ff;
      color: #0066cc;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .correo-col {
      color: #6b7280;
      font-size: 0.9rem;
    }

    .horas-input,
    .comentarios-input {
      width: 100%;
      padding: 0.5rem;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      font-size: 0.9rem;

      &:focus {
        outline: none;
        border-color: #0066cc;
      }

      &:disabled {
        background: #f9fafb;
        cursor: not-allowed;
      }
    }

    .horas-input {
      max-width: 100px;
    }

    .status-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;

      &.status-presente {
        background: #d1fae5;
        color: #065f46;
      }

      &.status-ausente {
        background: #fef3c7;
        color: #92400e;
      }
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
      .actions-bar {
        flex-direction: column;
        gap: 1rem;
      }

      .action-buttons {
        width: 100%;
        flex-direction: column;

        button {
          width: 100%;
        }
      }
    }
  `]
})
export class AsistenciaManagerComponent implements OnInit {
  @Input() coordinadorUid: string = '';

  private eventosService = inject(EventosService);
  private inscripcionesService = inject(InscripcionesService);

  eventos: Evento[] = [];
  eventoSeleccionadoId: string = '';
  eventoSeleccionado: Evento | null = null;
  inscripciones: AsistenciaRow[] = [];
  loading = false;
  guardando = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
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

  onEventoChange() {
    if (!this.eventoSeleccionadoId) {
      this.eventoSeleccionado = null;
      this.inscripciones = [];
      return;
    }

    this.eventoSeleccionado = this.eventos.find(e => e.eventoId === this.eventoSeleccionadoId) || null;
    this.cargarInscripciones();
  }

  cargarInscripciones() {
    this.loading = true;
    this.inscripcionesService.getInscripcionesByEvento(this.eventoSeleccionadoId).subscribe({
      next: (inscripciones) => {
        this.inscripciones = inscripciones.map(i => ({
          ...i,
          _checked: i.asistencia,
          _horas: i.horasGanadas || 0,
          _comentarios: i.comentarios || ''
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando inscripciones:', error);
        this.loading = false;
      }
    });
  }

  getInitials(nombre: string): string {
    const nombres = nombre.trim().split(' ');
    return nombres.length > 1 
      ? nombres[0][0] + nombres[1][0]
      : nombres[0][0];
  }

  getSeleccionados(): AsistenciaRow[] {
    return this.inscripciones.filter(i => i._checked);
  }

  todosSeleccionados(): boolean {
    return this.inscripciones.length > 0 && this.inscripciones.every(i => i._checked);
  }

  toggleTodos(event: any) {
    const checked = event.target.checked;
    this.inscripciones.forEach(i => i._checked = checked);
  }

  marcarTodosAsistencia(asistio: boolean) {
    this.inscripciones.forEach(i => {
      i._checked = asistio;
      if (asistio && !i._horas) {
        i._horas = 1; // Default 1 hour
      }
    });
  }

  async guardarAsistencias() {
    const seleccionados = this.getSeleccionados();
    
    if (seleccionados.length === 0) {
      this.errorMessage = 'No hay estudiantes seleccionados';
      return;
    }

    // Validate hours
    for (const inscripcion of seleccionados) {
      if (!inscripcion._horas || inscripcion._horas <= 0) {
        this.errorMessage = 'Por favor asigna horas válidas a todos los seleccionados';
        return;
      }
    }

    this.guardando = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const updates: UpdateAsistenciaData[] = seleccionados.map(i => ({
        inscripcionId: i.inscripcionId!,
        asistencia: true,
        horasGanadas: i._horas || 0,
        comentarios: i._comentarios
      }));

      await this.inscripcionesService.registrarAsistenciasMultiples(updates);
      
      this.successMessage = `✅ Asistencias guardadas exitosamente para ${updates.length} estudiantes`;
      setTimeout(() => {
        this.cargarInscripciones();
        this.successMessage = '';
      }, 3000);
    } catch (error: any) {
      console.error('Error guardando asistencias:', error);
      this.errorMessage = error.message || 'Error al guardar las asistencias';
    } finally {
      this.guardando = false;
    }
  }
}