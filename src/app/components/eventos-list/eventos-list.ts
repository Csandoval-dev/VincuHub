// src/app/components/eventos-list/eventos-list.component.ts

import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventosService } from '../../services/eventos.service';
import { Evento, EventoEstado } from '../../models/evento.model';

@Component({
  selector: 'app-eventos-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="eventos-container">
      <!-- Filtros y búsqueda -->
      <div class="filters-section">
        <div class="search-box">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input 
            type="text" 
            [(ngModel)]="searchTerm"
            (input)="filtrarEventos()"
            placeholder="Buscar eventos..."
            class="search-input">
        </div>

        <div class="filter-group">
          <select [(ngModel)]="filtroEstado" (change)="filtrarEventos()" class="filter-select">
            <option value="">Todos los estados</option>
            <option value="publicado">Publicados</option>
            <option value="borrador">Borradores</option>
            <option value="en_curso">En Curso</option>
            <option value="finalizado">Finalizados</option>
            <option value="cancelado">Cancelados</option>
          </select>

          <select [(ngModel)]="filtroCampus" (change)="filtrarEventos()" class="filter-select">
            <option value="">Todos los campus</option>
            <option value="Tegucigalpa">Tegucigalpa</option>
            <option value="San Pedro Sula">San Pedro Sula</option>
            <option value="La Ceiba">La Ceiba</option>
            <option value="Choluteca">Choluteca</option>
          </select>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Cargando eventos...</p>
      </div>

      <!-- Sin eventos -->
      <div *ngIf="!loading && eventosFiltrados.length === 0" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="empty-icon">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke-width="2"/>
          <line x1="16" y1="2" x2="16" y2="6" stroke-width="2"/>
          <line x1="8" y1="2" x2="8" y2="6" stroke-width="2"/>
          <line x1="3" y1="10" x2="21" y2="10" stroke-width="2"/>
        </svg>
        <h3>No hay eventos</h3>
        <p>{{ searchTerm ? 'No se encontraron eventos con ese criterio' : 'Aún no has creado ningún evento' }}</p>
      </div>

      <!-- Tabla de eventos -->
      <div *ngIf="!loading && eventosFiltrados.length > 0" class="eventos-table-container">
        <table class="eventos-table">
          <thead>
            <tr>
              <th>Evento</th>
              <th>Fecha</th>
              <th>Campus</th>
              <th>Inscritos</th>
              <th>Estado</th>
              <th class="actions-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let evento of eventosFiltrados" class="evento-row">
              <td class="evento-info">
                <div class="evento-imagen">
                  <img *ngIf="evento.imagenUrl" [src]="evento.imagenUrl" alt="{{evento.titulo}}">
                  <div *ngIf="!evento.imagenUrl" class="imagen-placeholder">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                      <polyline points="21 15 16 10 5 21" stroke-width="2"/>
                    </svg>
                  </div>
                </div>
                <div class="evento-detalles">
                  <div class="evento-titulo">{{ evento.titulo }}</div>
                  <div class="evento-tipo">{{ getTipoLabel(evento.tipo) }}</div>
                </div>
              </td>
              <td>
                <div class="fecha-info">
                  <div class="fecha-dia">{{ evento.fecha | date: 'dd/MM/yyyy' }}</div>
                  <div class="fecha-hora">{{ evento.horaInicio }} - {{ evento.horaFin }}</div>
                </div>
              </td>
              <td>
                <span class="campus-badge">{{ evento.campus }}</span>
              </td>
              <td>
                <div class="inscritos-info">
                  <span class="inscritos-count">{{ evento.inscritosCount || 0 }}</span>
                  <span class="inscritos-total">/ {{ evento.cupo }}</span>
                </div>
              </td>
              <td>
                <div class="estado-container">
                  <span class="estado-badge" [class]="'estado-' + evento.estado">
                    {{ getEstadoLabel(evento.estado) }}
                  </span>
                  <button class="btn-cambiar-estado" (click)="toggleMenuEstado(evento)" title="Cambiar estado">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="6 9 12 15 18 9" stroke-width="2"/>
                    </svg>
                  </button>
                  
                  <!-- Menu de estados -->
                  <div *ngIf="menuEstadoAbierto === evento.eventoId" class="menu-estados">
                    <button class="menu-item" (click)="cambiarEstado(evento, 'publicado')">
                      <span class="menu-dot estado-publicado"></span> Publicado
                    </button>
                    <button class="menu-item" (click)="cambiarEstado(evento, 'en_curso')">
                      <span class="menu-dot estado-en_curso"></span> En Curso
                    </button>
                    <button class="menu-item" (click)="cambiarEstado(evento, 'finalizado')">
                      <span class="menu-dot estado-finalizado"></span> Finalizado
                    </button>
                    <button class="menu-item" (click)="cambiarEstado(evento, 'cancelado')">
                      <span class="menu-dot estado-cancelado"></span> Cancelado
                    </button>
                  </div>
                </div>
              </td>
              <td class="actions-col">
                <div class="action-buttons">
                  <button class="btn-action" title="Ver detalles" (click)="verEvento(evento)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/>
                      <circle cx="12" cy="12" r="3" stroke-width="2"/>
                    </svg>
                    <span>Ver</span>
                  </button>
                  <button class="btn-action" title="Ver foro" (click)="abrirForo(evento)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2"/>
                    </svg>
                    <span>Foro</span>
                  </button>
                  <button class="btn-action btn-delete" title="Eliminar" (click)="eliminarEvento(evento)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="3 6 5 6 21 6" stroke-width="2"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2"/>
                    </svg>
                    <span>Eliminar</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal de detalles -->
      <div *ngIf="eventoSeleccionado" class="modal-overlay" (click)="cerrarModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ eventoSeleccionado.titulo }}</h2>
            <button class="btn-close" (click)="cerrarModal()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" stroke-width="2"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <div class="modal-body">
            <div *ngIf="eventoSeleccionado.imagenUrl" class="modal-imagen">
              <img [src]="eventoSeleccionado.imagenUrl" [alt]="eventoSeleccionado.titulo">
            </div>
            <div class="modal-info">
              <div class="info-row">
                <strong>Tipo:</strong>
                <span>{{ getTipoLabel(eventoSeleccionado.tipo) }}</span>
              </div>
              <div class="info-row">
                <strong>Fecha:</strong>
                <span>{{ eventoSeleccionado.fecha | date: 'dd/MM/yyyy' }}</span>
              </div>
              <div class="info-row">
                <strong>Horario:</strong>
                <span>{{ eventoSeleccionado.horaInicio }} - {{ eventoSeleccionado.horaFin }}</span>
              </div>
              <div class="info-row">
                <strong>Campus:</strong>
                <span>{{ eventoSeleccionado.campus }}</span>
              </div>
              <div class="info-row">
                <strong>Ubicación:</strong>
                <span>{{ eventoSeleccionado.ubicacion }}</span>
              </div>
              <div class="info-row">
                <strong>Facultad:</strong>
                <span>{{ eventoSeleccionado.facultad }}</span>
              </div>
              <div class="info-row">
                <strong>Cupo:</strong>
                <span>{{ eventoSeleccionado.inscritosCount || 0 }} / {{ eventoSeleccionado.cupo }}</span>
              </div>
              <div class="info-row full">
                <strong>Descripción:</strong>
                <p>{{ eventoSeleccionado.descripcion }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .eventos-container {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .filters-section {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 300px;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #0066cc;
      }
    }

    .filter-group {
      display: flex;
      gap: 0.75rem;
    }

    .filter-select {
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.9rem;
      cursor: pointer;
      background: white;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #0066cc;
      }
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 2rem;
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
      color: #d1d5db;
      margin: 0 auto 1rem;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      color: #111827;
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      color: #6b7280;
      margin: 0;
    }

    .eventos-table-container {
      overflow-x: auto;
    }

    .eventos-table {
      width: 100%;
      border-collapse: collapse;
    }

    .eventos-table thead {
      background: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
    }

    .eventos-table th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.875rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .eventos-table td {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .evento-row {
      transition: background 0.2s;

      &:hover {
        background: #f9fafb;
      }
    }

    .evento-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .evento-imagen {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .imagen-placeholder {
      width: 100%;
      height: 100%;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
    }

    .evento-detalles {
      flex: 1;
    }

    .evento-titulo {
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .evento-tipo {
      font-size: 0.8rem;
      color: #6b7280;
    }

    .fecha-info {
      text-align: left;
    }

    .fecha-dia {
      font-weight: 600;
      color: #111827;
    }

    .fecha-hora {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .campus-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      background: #eff6ff;
      color: #0066cc;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .inscritos-info {
      font-weight: 600;
      color: #111827;
    }

    .inscritos-total {
      color: #9ca3af;
    }

    .estado-container {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .estado-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;

      &.estado-publicado {
        background: #d1fae5;
        color: #065f46;
      }

      &.estado-borrador {
        background: #e5e7eb;
        color: #374151;
      }

      &.estado-en_curso {
        background: #dbeafe;
        color: #1e40af;
      }

      &.estado-finalizado {
        background: #fef3c7;
        color: #92400e;
      }

      &.estado-cancelado {
        background: #fee2e2;
        color: #991b1b;
      }
    }

    .btn-cambiar-estado {
      padding: 0.25rem;
      background: transparent;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      color: #6b7280;
      transition: all 0.2s;

      &:hover {
        background: #f3f4f6;
        color: #111827;
      }
    }

    .menu-estados {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 0.5rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10;
      min-width: 160px;
    }

    .menu-item {
      width: 100%;
      padding: 0.75rem 1rem;
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #374151;
      transition: background 0.2s;

      &:hover {
        background: #f3f4f6;
      }

      &:first-child {
        border-radius: 8px 8px 0 0;
      }

      &:last-child {
        border-radius: 0 0 8px 8px;
      }
    }

    .menu-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.estado-publicado {
        background: #065f46;
      }

      &.estado-en_curso {
        background: #1e40af;
      }

      &.estado-finalizado {
        background: #92400e;
      }

      &.estado-cancelado {
        background: #991b1b;
      }
    }

    .actions-col {
      width: 300px;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .btn-action {
      padding: 0.5rem 0.75rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 0.375rem;

      svg {
        flex-shrink: 0;
      }

      &:hover {
        border-color: #0066cc;
        color: #0066cc;
        background: #eff6ff;
        transform: translateY(-1px);
      }

      &.btn-delete {
        &:hover {
          border-color: #dc2626;
          color: #dc2626;
          background: #fef2f2;
        }
      }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;

      h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #111827;
      }
    }

    .btn-close {
      padding: 0.5rem;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #6b7280;
      transition: color 0.2s;

      &:hover {
        color: #111827;
      }
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-imagen {
      margin-bottom: 1.5rem;
      border-radius: 8px;
      overflow: hidden;

      img {
        width: 100%;
        height: auto;
      }
    }

    .modal-info {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-row {
      display: flex;
      gap: 1rem;

      &.full {
        flex-direction: column;
        gap: 0.5rem;
      }

      strong {
        min-width: 100px;
        color: #6b7280;
        font-weight: 600;
      }

      span, p {
        color: #111827;
        margin: 0;
      }
    }

    @media (max-width: 768px) {
      .filters-section {
        flex-direction: column;
      }

      .search-box {
        min-width: 100%;
      }

      .filter-group {
        flex-direction: column;
      }

      .action-buttons {
        flex-direction: column;

        .btn-action span {
          display: none;
        }
      }
    }
  `]
})
export class EventosListComponent implements OnInit {
  @Input() coordinadorUid: string = '';
  @Output() abrirForoEvento = new EventEmitter<Evento>();
  
  private eventosService = inject(EventosService);

  eventos: Evento[] = [];
  eventosFiltrados: Evento[] = [];
  searchTerm = '';
  filtroEstado: EventoEstado | '' = '';
  filtroCampus = '';
  loading = true;
  eventoSeleccionado: Evento | null = null;
  menuEstadoAbierto: string | null = null;

  ngOnInit() {
    this.cargarEventos();
    // Cerrar menu al hacer click fuera
    document.addEventListener('click', () => {
      this.menuEstadoAbierto = null;
    });
  }

  cargarEventos() {
    this.loading = true;
    this.eventosService.getEventosByCoordinador(this.coordinadorUid).subscribe({
      next: (eventos) => {
        this.eventos = eventos;
        this.eventosFiltrados = eventos;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando eventos:', error);
        this.loading = false;
      }
    });
  }

  filtrarEventos() {
    this.eventosFiltrados = this.eventos.filter(evento => {
      const matchSearch = evento.titulo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                         evento.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchEstado = !this.filtroEstado || evento.estado === this.filtroEstado;
      const matchCampus = !this.filtroCampus || evento.campus === this.filtroCampus;
      
      return matchSearch && matchEstado && matchCampus;
    });
  }

  getTipoLabel(tipo: string): string {
    const labels: any = {
      'feria': 'Feria',
      'voluntariado': 'Voluntariado',
      'conferencia': 'Conferencia',
      'taller': 'Taller',
      'otro': 'Otro'
    };
    return labels[tipo] || tipo;
  }

  getEstadoLabel(estado: string): string {
    const labels: any = {
      'borrador': 'Borrador',
      'publicado': 'Publicado',
      'en_curso': 'En Curso',
      'finalizado': 'Finalizado',
      'cancelado': 'Cancelado'
    };
    return labels[estado] || estado;
  }

  toggleMenuEstado(evento: Evento) {
    event?.stopPropagation();
    this.menuEstadoAbierto = this.menuEstadoAbierto === evento.eventoId ? null : evento.eventoId!;
  }

  async cambiarEstado(evento: Evento, nuevoEstado: EventoEstado) {
    this.menuEstadoAbierto = null;
    
    try {
      await this.eventosService.cambiarEstado(evento.eventoId!, nuevoEstado);
      this.cargarEventos();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar el estado del evento');
    }
  }

  verEvento(evento: Evento) {
    this.eventoSeleccionado = evento;
  }

  cerrarModal() {
    this.eventoSeleccionado = null;
  }

  abrirForo(evento: Evento) {
    this.abrirForoEvento.emit(evento);
  }

  async eliminarEvento(evento: Evento) {
    if (!confirm(`¿Estás seguro de eliminar el evento "${evento.titulo}"?`)) {
      return;
    }

    try {
      await this.eventosService.eliminarEvento(evento.eventoId!);
      this.cargarEventos();
    } catch (error) {
      console.error('Error eliminando evento:', error);
      alert('Error al eliminar el evento');
    }
  }
}