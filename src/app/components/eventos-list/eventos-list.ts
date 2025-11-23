// src/app/components/eventos-list/eventos-list.component.ts

import { Component, OnInit, inject, Input } from '@angular/core';
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
          <input 
            type="text" 
            [(ngModel)]="searchTerm"
            (input)="filtrarEventos()"
            placeholder="Buscar eventos..."
            class="search-input">
          <span class="search-icon">🔍</span>
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
        <div class="empty-icon">📅</div>
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
                  <div *ngIf="!evento.imagenUrl" class="imagen-placeholder">📅</div>
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
                <span class="estado-badge" [class]="'estado-' + evento.estado">
                  {{ getEstadoLabel(evento.estado) }}
                </span>
              </td>
              <td class="actions-col">
                <div class="action-buttons">
                  <button class="btn-icon" title="Ver detalles" (click)="verEvento(evento)">
                    👁️
                  </button>
                  <button class="btn-icon" title="Editar" (click)="editarEvento(evento)">
                    ✏️
                  </button>
                  <button class="btn-icon" title="Ver inscritos" (click)="verInscritos(evento)">
                    👥
                  </button>
                  <button class="btn-icon" title="Foro" (click)="verForo(evento)">
                    💬
                  </button>
                  <button class="btn-icon danger" title="Eliminar" (click)="eliminarEvento(evento)">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.25rem;
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
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
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
      font-size: 1.5rem;
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

    .actions-col {
      width: 200px;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        border-color: #0066cc;
        background: #eff6ff;
        transform: translateY(-2px);
      }

      &.danger:hover {
        border-color: #dc2626;
        background: #fef2f2;
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
    }
  `]
})
export class EventosListComponent implements OnInit {
  @Input() coordinadorUid: string = '';
  
  private eventosService = inject(EventosService);

  eventos: Evento[] = [];
  eventosFiltrados: Evento[] = [];
  searchTerm = '';
  filtroEstado: EventoEstado | '' = '';
  filtroCampus = '';
  loading = true;

  ngOnInit() {
    this.cargarEventos();
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

  verEvento(evento: Evento) {
    console.log('Ver evento:', evento);
    // Implementar vista de detalles
  }

  editarEvento(evento: Evento) {
    console.log('Editar evento:', evento);
    // Implementar edición
  }

  verInscritos(evento: Evento) {
    console.log('Ver inscritos:', evento);
    // Implementar vista de inscritos
  }

  verForo(evento: Evento) {
    console.log('Ver foro:', evento);
    // Implementar vista de foro
  }

  async eliminarEvento(evento: Evento) {
    if (!confirm(`¿Estás seguro de eliminar el evento "${evento.titulo}"?`)) {
      return;
    }

    try {
      await this.eventosService.eliminarEvento(evento.eventoId!);
      alert('Evento eliminado exitosamente');
      this.cargarEventos();
    } catch (error) {
      console.error('Error eliminando evento:', error);
      alert('Error al eliminar el evento');
    }
  }
}