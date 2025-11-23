// src/app/components/evento-form/evento-form.component.ts

import { Component, OnInit, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventosService } from '../../services/eventos.service';
import { ForosService } from '../../services/foros.service';
import { Evento, CreateEventoData, EventoTipo } from '../../models/evento.model';

@Component({
  selector: 'app-evento-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="form-container">
      <form (ngSubmit)="onSubmit()" class="evento-form">
        
        <!-- Información básica -->
        <div class="form-section">
          <h3 class="section-title">Información Básica</h3>
          
          <div class="form-group">
            <label class="form-label">Título del Evento *</label>
            <input 
              type="text" 
              [(ngModel)]="formData.titulo"
              name="titulo"
              placeholder="Ej: Feria de Ciencias 2024"
              class="form-input"
              required>
          </div>

          <div class="form-group">
            <label class="form-label">Descripción *</label>
            <textarea 
              [(ngModel)]="formData.descripcion"
              name="descripcion"
              rows="4"
              placeholder="Describe el evento, objetivos y actividades..."
              class="form-textarea"
              required></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tipo de Evento *</label>
              <select 
                [(ngModel)]="formData.tipo"
                name="tipo"
                class="form-select"
                required>
                <option value="">Seleccionar tipo</option>
                <option value="feria">Feria</option>
                <option value="voluntariado">Voluntariado</option>
                <option value="conferencia">Conferencia</option>
                <option value="taller">Taller</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Facultad *</label>
              <input 
                type="text" 
                [(ngModel)]="formData.facultad"
                name="facultad"
                placeholder="Ej: Ingeniería"
                class="form-input"
                required>
            </div>
          </div>
        </div>

        <!-- Fecha y hora -->
        <div class="form-section">
          <h3 class="section-title">Fecha y Horario</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fecha del Evento *</label>
              <input 
                type="date" 
                [(ngModel)]="fechaString"
                name="fecha"
                class="form-input"
                [min]="minDate"
                required>
            </div>

            <div class="form-group">
              <label class="form-label">Hora de Inicio *</label>
              <input 
                type="time" 
                [(ngModel)]="formData.horaInicio"
                name="horaInicio"
                class="form-input"
                required>
            </div>

            <div class="form-group">
              <label class="form-label">Hora de Fin *</label>
              <input 
                type="time" 
                [(ngModel)]="formData.horaFin"
                name="horaFin"
                class="form-input"
                required>
            </div>
          </div>
        </div>

        <!-- Ubicación -->
        <div class="form-section">
          <h3 class="section-title">Ubicación</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Campus *</label>
              <select 
                [(ngModel)]="formData.campus"
                name="campus"
                class="form-select"
                required>
                <option value="">Seleccionar campus</option>
                <option value="Tegucigalpa">Tegucigalpa</option>
                <option value="San Pedro Sula">San Pedro Sula</option>
                <option value="La Ceiba">La Ceiba</option>
                <option value="Choluteca">Choluteca</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Ubicación Específica *</label>
              <input 
                type="text" 
                [(ngModel)]="formData.ubicacion"
                name="ubicacion"
                placeholder="Ej: Auditorio Principal"
                class="form-input"
                required>
            </div>

            <div class="form-group">
              <label class="form-label">Cupo Máximo *</label>
              <input 
                type="number" 
                [(ngModel)]="formData.cupo"
                name="cupo"
                min="1"
                placeholder="100"
                class="form-input"
                required>
            </div>
          </div>
        </div>

        <!-- Imagen -->
        <div class="form-section">
          <h3 class="section-title">Imagen del Evento</h3>
          
          <div class="image-upload-area">
            <!-- Preview de imagen -->
            <div *ngIf="imagePreview || formData.imagenUrl" class="image-preview">
              <img [src]="imagePreview || formData.imagenUrl" alt="Vista previa">
              <button 
                type="button" 
                class="btn-remove-image"
                (click)="removeImage()">
                ✕
              </button>
            </div>

            <!-- Upload button -->
            <div *ngIf="!imagePreview && !formData.imagenUrl" class="upload-placeholder">
              <div class="upload-icon">📷</div>
              <p class="upload-text">Haz click o arrastra una imagen</p>
              <p class="upload-hint">PNG, JPG hasta 5MB</p>
              <input 
                type="file" 
                #fileInput
                (change)="onFileSelected($event)"
                accept="image/*"
                class="file-input">
              <button 
                type="button" 
                class="btn-upload"
                (click)="fileInput.click()">
                Seleccionar Imagen
              </button>
            </div>
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="form-actions">
          <button 
            type="button" 
            class="btn-secondary"
            (click)="onCancel()"
            [disabled]="loading">
            Cancelar
          </button>
          <button 
            type="submit" 
            class="btn-primary"
            [disabled]="loading || !isFormValid()">
            {{ loading ? 'Guardando...' : (editMode ? 'Actualizar Evento' : 'Crear Evento') }}
          </button>
        </div>

        <!-- Mensajes -->
        <div *ngIf="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>
        <div *ngIf="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-container {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      max-width: 900px;
    }

    .evento-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      font-weight: 600;
      color: #374151;
      font-size: 0.9rem;
    }

    .form-input,
    .form-select,
    .form-textarea {
      padding: 0.75rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: all 0.2s;
      font-family: inherit;

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

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .image-upload-area {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      transition: all 0.2s;

      &:hover {
        border-color: #0066cc;
        background: #f9fafb;
      }
    }

    .image-preview {
      position: relative;
      max-width: 400px;
      margin: 0 auto;

      img {
        width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    .btn-remove-image {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 32px;
      height: 32px;
      background: rgba(220, 38, 38, 0.9);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: #dc2626;
        transform: scale(1.1);
      }
    }

    .upload-placeholder {
      padding: 2rem;
    }

    .upload-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .upload-text {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 0.25rem 0;
    }

    .upload-hint {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 1.5rem 0;
    }

    .file-input {
      display: none;
    }

    .btn-upload {
      padding: 0.75rem 1.5rem;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #0052a3;
      }
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }

    .btn-primary,
    .btn-secondary {
      padding: 0.875rem 2rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-primary {
      background: #0066cc;
      color: white;

      &:hover:not(:disabled) {
        background: #0052a3;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 102, 204, 0.25);
      }
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;

      &:hover:not(:disabled) {
        background: #e5e7eb;
      }
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      margin-top: 1rem;

      &.alert-error {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }

      &.alert-success {
        background: #f0fdf4;
        color: #166534;
        border: 1px solid #bbf7d0;
      }
    }

    @media (max-width: 768px) {
      .form-container {
        padding: 1.5rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column-reverse;

        button {
          width: 100%;
        }
      }
    }
  `]
})
export class EventoFormComponent implements OnInit {
  @Input() evento: Evento | null = null;
  @Input() editMode = false;
  @Output() eventoCreado = new EventEmitter<string>();
  @Output() eventoActualizado = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  private eventosService = inject(EventosService);
  private forosService = inject(ForosService);

  formData: CreateEventoData = {
    titulo: '',
    descripcion: '',
    fecha: new Date(),
    horaInicio: '',
    horaFin: '',
    ubicacion: '',
    campus: '',
    facultad: '',
    cupo: 50,
    tipo: 'feria'
  };

  fechaString = '';
  minDate = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    // If editing, populate form
    if (this.editMode && this.evento) {
      this.formData = {
        titulo: this.evento.titulo,
        descripcion: this.evento.descripcion,
        fecha: this.evento.fecha,
        horaInicio: this.evento.horaInicio,
        horaFin: this.evento.horaFin,
        ubicacion: this.evento.ubicacion,
        campus: this.evento.campus,
        facultad: this.evento.facultad,
        cupo: this.evento.cupo,
        tipo: this.evento.tipo,
        imagenUrl: this.evento.imagenUrl
      };
      this.fechaString = this.evento.fecha.toISOString().split('T')[0];
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        this.errorMessage = 'La imagen no debe superar 5MB';
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Solo se permiten archivos de imagen';
        return;
      }

      this.selectedFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.formData.imagenUrl = undefined;
  }

  isFormValid(): boolean {
    return !!(
      this.formData.titulo &&
      this.formData.descripcion &&
      this.fechaString &&
      this.formData.horaInicio &&
      this.formData.horaFin &&
      this.formData.ubicacion &&
      this.formData.campus &&
      this.formData.facultad &&
      this.formData.cupo > 0 &&
      this.formData.tipo
    );
  }

  async onSubmit() {
    if (!this.isFormValid()) {
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Convert date string to Date
      this.formData.fecha = new Date(this.fechaString);

      if (this.editMode && this.evento) {
        // Update existing event
        await this.eventosService.actualizarEvento(
          this.evento.eventoId!,
          this.formData,
          this.selectedFile || undefined
        );
        this.successMessage = 'Evento actualizado exitosamente';
        setTimeout(() => this.eventoActualizado.emit(), 1500);
      } else {
        // Create new event
        const eventoId = await this.eventosService.crearEvento(
          this.formData,
          this.selectedFile || undefined
        );

        // Create forum for the event
        await this.forosService.crearForoParaEvento(eventoId, this.formData.titulo);

        this.successMessage = 'Evento creado exitosamente';
        setTimeout(() => this.eventoCreado.emit(eventoId), 1500);
      }
    } catch (error: any) {
      console.error('Error guardando evento:', error);
      this.errorMessage = error.message || 'Error al guardar el evento';
    } finally {
      this.loading = false;
    }
  }

  onCancel() {
    this.cancelar.emit();
  }
}