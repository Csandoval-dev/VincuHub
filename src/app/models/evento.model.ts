// src/app/models/evento.model.ts

export type EventoEstado = 'borrador' | 'publicado' | 'en_curso' | 'finalizado' | 'cancelado';
export type EventoTipo = 'feria' | 'voluntariado' | 'conferencia' | 'taller' | 'otro';

export interface Evento {
  eventoId?: string;
  titulo: string;
  descripcion: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  ubicacion: string;
  campus: string;
  facultad: string;
  cupo: number;
  tipo: EventoTipo;
  creadorUid: string;
  creadorNombre?: string;
  imagenUrl?: string;
  estado: EventoEstado;
  inscritosCount?: number;
  foroId?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateEventoData {
  titulo: string;
  descripcion: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  ubicacion: string;
  campus: string;
  facultad: string;
  cupo: number;
  tipo: EventoTipo;
  imagenUrl?: string;
}