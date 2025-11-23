// src/app/components/certificados-manager/certificados-manager.component.ts

import { Component, OnInit, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventosService } from '../../services/eventos.service';
import { InscripcionesService } from '../../services/inscripciones.service';
import { PdfService, CertificadoData } from '../../services/pdf.service';
import { Evento } from '../../models/evento.model';
import { Inscripcion } from '../../models/inscripcion.model';
import { User } from '../../models/user.model';

interface EstudianteCertificado extends Inscripcion {
  _selected?: boolean;
}

@Component({
  selector: 'app-certificados-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="certificados-container">
      
      <!-- Selección de evento -->
      <div class="evento-selector">
        <h3>Selecciona un Evento Finalizado</h3>
        <select 
          [(ngModel)]="eventoSeleccionadoId"
          (change)="onEventoChange()"
          class="evento-select">
          <option value="">-- Seleccionar evento --</option>
         <option *ngFor="let evento of eventos" [value]="evento.eventoId">
            {{ evento.titulo }} - {{ evento.fecha | date: 'dd/MM/yyyy' }}
          </option>
        </select>
      </div>

      <!-- Información del evento -->
      <div *ngIf="eventoSeleccionado" class="evento-info-card">
        <div class="info-content">
          <h4>{{ eventoSeleccionado.titulo }}</h4>
          <div class="info-stats">
            <div class="stat-item">
              <span class="stat-label">Fecha:</span>
              <span class="stat-value">{{ eventoSeleccionado.fecha | date: 'dd/MM/yyyy' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Asistieron:</span>
              <span class="stat-value">{{ getEstudiantesConAsistencia().length }} estudiantes</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Campus:</span>
              <span class="stat-value">{{ eventoSeleccionado.campus }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando información...</p>
      </div>

      <!-- Sin estudiantes -->
      <div *ngIf="!loading && eventoSeleccionado && estudiantes.length === 0" class="empty-state">
        <div class="empty-icon">📜</div>
        <h3>No hay certificados disponibles</h3>
        <p>No hay estudiantes con asistencia registrada en este evento</p>
      </div>

      <!-- Lista de estudiantes -->
      <div *ngIf="!loading && estudiantes.length > 0" class="certificados-section">
        
        <!-- Acciones -->
        <div class="actions-bar">
          <div class="selection-info">
            <input 
              type="checkbox"
              [checked]="todosSeleccionados()"
              (change)="toggleTodos($event)"
              class="checkbox">
            <span>{{ getSeleccionados().length }} seleccionados</span>
          </div>
          <div class="action-buttons">
            <button 
              class="btn-secondary"
              (click)="previsualizarCertificado()"
              [disabled]="getSeleccionados().length !== 1">
              👁️ Vista Previa
            </button>
            <button 
              class="btn-primary"
              (click)="generarCertificados()"
              [disabled]="generando || getSeleccionados().length === 0">
              {{ generando ? 'Generando...' : '📥 Descargar Certificados' }}
            </button>
          </div>
        </div>

        <!-- Tabla -->
        <div class="table-container">
          <table class="certificados-table">
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
                <th>Horas Obtenidas</th>
                <th>Fecha Asistencia</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let estudiante of estudiantes" class="table-row">
                <td class="check-col">
                  <input 
                    type="checkbox"
                    [(ngModel)]="estudiante._selected"
                    class="checkbox">
                </td>
                <td>
                  <div class="estudiante-info">
                    <div class="estudiante-avatar">
                      {{ getInitials(estudiante.nombreEstudiante || '') }}
                    </div>
                    <div>
                      <div class="estudiante-nombre">{{ estudiante.nombreEstudiante }}</div>
                      <div class="estudiante-correo">{{ estudiante.correoEstudiante }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="carrera-badge">{{ estudiante.carrera }}</span>
                </td>
                <td>
                  <span class="horas-badge">{{ estudiante.horasGanadas }} hrs</span>
                </td>
                <td>
                  <span class="fecha-texto">
                    {{ estudiante.fechaRegistroAsistencia | date: 'dd/MM/yyyy' }}
                  </span>
                </td>
                <td>
                  <button 
                    class="btn-download"
                    (click)="generarCertificadoIndividual(estudiante)"
                    title="Descargar certificado">
                    📥
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Resumen -->
        <div class="resumen-bar">
          <p>
            Total: <strong>{{ estudiantes.length }}</strong> estudiantes con asistencia registrada.
            Horas totales certificadas: <strong>{{ getTotalHoras() }}</strong> horas.
          </p>
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
    .certificados-container {
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
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);

      h4 {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
      }
    }

    .info-stats {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-label {
      font-size: 0.85rem;
      opacity: 0.9;
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 600;
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

    .certificados-section {
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
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      color: #374151;
    }

    .checkbox {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
    }

    .btn-primary,
    .btn-secondary {
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

    .btn-primary {
      background: #10b981;
      color: white;

      &:hover:not(:disabled) {
        background: #059669;
        transform: translateY(-1px);
      }
    }

    .btn-secondary {
      background: white;
      border: 2px solid #e5e7eb;
      color: #374151;

      &:hover:not(:disabled) {
        border-color: #0066cc;
        color: #0066cc;
      }
    }

    .table-container {
      overflow-x: auto;
    }

    .certificados-table {
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

    .estudiante-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .estudiante-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
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

    .estudiante-correo {
      font-size: 0.85rem;
      color: #6b7280;
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

    .horas-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      background: #d1fae5;
      color: #065f46;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .fecha-texto {
      color: #6b7280;
      font-size: 0.9rem;
    }

    .btn-download {
      width: 36px;
      height: 36px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 1rem;

      &:hover {
        border-color: #10b981;
        background: #f0fdf4;
        transform: translateY(-2px);
      }
    }

    .resumen-bar {
      padding: 1rem 1.25rem;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;

      p {
        margin: 0;
        color: #6b7280;
        font-size: 0.9rem;

        strong {
          color: #111827;
          font-weight: 600;
        }
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

      .info-stats {
        flex-direction: column;
        gap: 0.75rem;
      }
    }
  `]
})
export class CertificadosManagerComponent implements OnInit {
  @Input() coordinadorUid: string = '';
  @Input() coordinadorNombre: string = '';

  private eventosService = inject(EventosService);
  private inscripcionesService = inject(InscripcionesService);
  private pdfService = inject(PdfService);

  eventos: Evento[] = [];
  eventoSeleccionadoId: string = '';
  eventoSeleccionado: Evento | null = null;
  estudiantes: EstudianteCertificado[] = [];
  
  loading = false;
  generando = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.cargarEventos();
  }

  cargarEventos() {
    this.eventosService.getEventosByCoordinador(this.coordinadorUid).subscribe({
      next: (eventos) => {
        // Solo eventos finalizados
        this.eventos = eventos.filter(e => e.estado === 'finalizado');
      },
      error: (error) => {
        console.error('Error cargando eventos:', error);
      }
    });
  }

  onEventoChange() {
    if (!this.eventoSeleccionadoId) {
      this.eventoSeleccionado = null;
      this.estudiantes = [];
      return;
    }

    this.eventoSeleccionado = this.eventos.find(e => e.eventoId === this.eventoSeleccionadoId) || null;
    this.cargarEstudiantes();
  }

  cargarEstudiantes() {
    this.loading = true;
    this.inscripcionesService.getInscripcionesByEvento(this.eventoSeleccionadoId).subscribe({
      next: (inscripciones) => {
        // Solo estudiantes con asistencia
        this.estudiantes = inscripciones
          .filter(i => i.asistencia && i.horasGanadas > 0)
          .map(i => ({
            ...i,
            _selected: false
          }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando estudiantes:', error);
        this.loading = false;
      }
    });
  }

  getEstudiantesConAsistencia(): EstudianteCertificado[] {
    return this.estudiantes.filter(e => e.asistencia);
  }

  getSeleccionados(): EstudianteCertificado[] {
    return this.estudiantes.filter(e => e._selected);
  }

  todosSeleccionados(): boolean {
    return this.estudiantes.length > 0 && this.estudiantes.every(e => e._selected);
  }

  toggleTodos(event: any) {
    const checked = event.target.checked;
    this.estudiantes.forEach(e => e._selected = checked);
  }

  getInitials(nombre: string): string {
    const nombres = nombre.trim().split(' ');
    return nombres.length > 1 
      ? nombres[0][0] + nombres[1][0]
      : nombres[0][0];
  }

  getTotalHoras(): number {
    return this.estudiantes.reduce((sum, e) => sum + e.horasGanadas, 0);
  }

  generarCertificadoIndividual(estudiante: EstudianteCertificado) {
    if (!this.eventoSeleccionado) return;

    const data: CertificadoData = {
      nombreEstudiante: estudiante.nombreEstudiante || '',
      nombreEvento: this.eventoSeleccionado.titulo,
      horasGanadas: estudiante.horasGanadas,
      fechaEvento: this.eventoSeleccionado.fecha,
      nombreCoordinador: this.coordinadorNombre,
      campus: this.eventoSeleccionado.campus
    };

    try {
      this.pdfService.generarCertificado(data);
      this.successMessage = `Certificado generado para ${estudiante.nombreEstudiante}`;
      setTimeout(() => this.successMessage = '', 3000);
    } catch (error) {
      console.error('Error generando certificado:', error);
      this.errorMessage = 'Error al generar el certificado';
    }
  }

  async generarCertificados() {
    const seleccionados = this.getSeleccionados();
    
    if (seleccionados.length === 0) {
      this.errorMessage = 'Selecciona al menos un estudiante';
      return;
    }

    if (!this.eventoSeleccionado) return;

    this.generando = true;
    this.errorMessage = '';

    try {
      const certificados: CertificadoData[] = seleccionados.map(e => ({
        nombreEstudiante: e.nombreEstudiante || '',
        nombreEvento: this.eventoSeleccionado!.titulo,
        horasGanadas: e.horasGanadas,
        fechaEvento: this.eventoSeleccionado!.fecha,
        nombreCoordinador: this.coordinadorNombre,
        campus: this.eventoSeleccionado!.campus
      }));

      await this.pdfService.generarCertificadosMultiples(certificados);
      
      this.successMessage = `✅ ${certificados.length} certificados generados exitosamente`;
      setTimeout(() => this.successMessage = '', 5000);
    } catch (error) {
      console.error('Error generando certificados:', error);
      this.errorMessage = 'Error al generar los certificados';
    } finally {
      this.generando = false;
    }
  }

  previsualizarCertificado() {
    const seleccionados = this.getSeleccionados();
    
    if (seleccionados.length !== 1) {
      this.errorMessage = 'Selecciona solo un estudiante para vista previa';
      return;
    }

    this.generarCertificadoIndividual(seleccionados[0]);
  }
}