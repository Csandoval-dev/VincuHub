// src/app/models/inscripcion.model.ts

export interface Inscripcion {
  inscripcionId?: string;
  uid: string;
  eventoId: string;
  
  // Datos del estudiante (desnormalizado para queries rápidas)
  nombreEstudiante?: string;
  correoEstudiante?: string;
  carrera?: string;
  
  fechaInscripcion: Date;
  asistencia: boolean;
  horasGanadas: number;
  registradoPor?: string; // UID del coordinador que registró
  fechaRegistroAsistencia?: Date;
  
  // Campos adicionales útiles
  comentarios?: string;
  calificacion?: number; // 1-5 estrellas opcional
}

export interface UpdateAsistenciaData {
  inscripcionId: string;
  asistencia: boolean;
  horasGanadas: number;
  comentarios?: string;
}