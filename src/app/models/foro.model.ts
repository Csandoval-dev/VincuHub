// src/app/models/foro.model.ts

export interface Foro {
  foroId?: string;
  eventoId: string;
  titulo: string;
  descripcion: string;
  creadorUid: string;
  fechaCreacion: Date;
  cerrado?: boolean;
  moderadorUid?: string;
  mensajesCount?: number;
}

export interface MensajeForo {
  mensajeId?: string;
  foroId: string;
  uid: string;
  
  // Datos del usuario (desnormalizado)
  nombreUsuario?: string;
  rolUsuario?: string;
  fotoUsuario?: string;
  
  contenido: string;
  fecha: Date;
  editado?: boolean;
  eliminado?: boolean;
}

export interface CreateMensajeData {
  contenido: string;
}