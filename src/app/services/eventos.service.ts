// src/app/services/eventos.service.ts

import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Evento, CreateEventoData, EventoEstado } from '../models/evento.model';
import { AuthService } from './auth.service';
import { ImageCompressor } from '../utils/image-compressor';

@Injectable({
  providedIn: 'root'
})
export class EventosService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private eventosCollection = collection(this.firestore, 'eventos');

  // Crear evento con imagen Base64
  async crearEvento(data: CreateEventoData, imagenFile?: File): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    let imagenUrl = data.imagenUrl || '';
    
    // Comprimir y convertir imagen a Base64
    if (imagenFile) {
      console.log('📸 Procesando imagen...');
      
      // Validar tipo de archivo
      if (!ImageCompressor.isValidImageFile(imagenFile)) {
        throw new Error('El archivo debe ser una imagen (JPG, PNG, WEBP)');
      }
      
      // Validar tamaño máximo del archivo original (10MB)
      if (!ImageCompressor.isValidFileSize(imagenFile, 10)) {
        throw new Error('La imagen no debe superar 10MB');
      }
      
      // Comprimir imagen a máximo 400KB
      imagenUrl = await ImageCompressor.compressImage(imagenFile, 400, 0.8);
      console.log('✅ Imagen procesada correctamente');
    }

    const nuevoEvento: Evento = {
      ...data,
      creadorUid: user.uid,
      creadorNombre: user.nombre,
      imagenUrl,
      estado: 'publicado',
      inscritosCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await addDoc(this.eventosCollection, {
      ...nuevoEvento,
      fecha: Timestamp.fromDate(nuevoEvento.fecha),
      createdAt: Timestamp.fromDate(nuevoEvento.createdAt),
      updatedAt: Timestamp.fromDate(nuevoEvento.updatedAt!)
    });

    // Actualizar con el ID generado
    await updateDoc(doc(this.firestore, `eventos/${docRef.id}`), {
      eventoId: docRef.id
    });

    return docRef.id;
  }

  // ✅ CORREGIDO: Obtener eventos del coordinador
  getEventosByCoordinador(coordinadorUid: string): Observable<Evento[]> {
    const firestore = this.firestore; // Guardar referencia
    
    return from(
      (async () => {
        const q = query(
          collection(firestore, 'eventos'),
          where('creadorUid', '==', coordinadorUid),
          orderBy('fecha', 'desc')
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return this.convertTimestamps({
            ...data,
            eventoId: doc.id
          });
        });
      })()
    );
  }

  // ✅ CORREGIDO: Obtener todos los eventos (para estudiantes)
  getEventosPublicados(campus?: string): Observable<Evento[]> {
    const firestore = this.firestore; // Guardar referencia
    
    return from(
      (async () => {
        let q = query(
          collection(firestore, 'eventos'),
          where('estado', '==', 'publicado'),
          orderBy('fecha', 'asc')
        );

        if (campus) {
          q = query(q, where('campus', '==', campus));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return this.convertTimestamps({
            ...data,
            eventoId: doc.id
          });
        });
      })()
    );
  }

  // Obtener evento por ID
  getEventoById(eventoId: string): Observable<Evento | null> {
    const docRef = doc(this.firestore, `eventos/${eventoId}`);
    return from(getDoc(docRef)).pipe(
      map(docSnap => {
        if (!docSnap.exists()) return null;
        return this.convertTimestamps({ ...docSnap.data(), eventoId: docSnap.id });
      })
    );
  }

  // Actualizar evento
  async actualizarEvento(eventoId: string, data: Partial<Evento>, imagenFile?: File): Promise<void> {
    const docRef = doc(this.firestore, `eventos/${eventoId}`);
    
    let updateData: any = {
      ...data,
      updatedAt: Timestamp.now()
    };

    // Si hay nueva imagen
    if (imagenFile) {
      console.log('📸 Procesando nueva imagen...');
      
      // Validar y comprimir
      if (!ImageCompressor.isValidImageFile(imagenFile)) {
        throw new Error('El archivo debe ser una imagen');
      }
      
      if (!ImageCompressor.isValidFileSize(imagenFile, 10)) {
        throw new Error('La imagen no debe superar 10MB');
      }
      
      updateData.imagenUrl = await ImageCompressor.compressImage(imagenFile, 400, 0.8);
      console.log('✅ Nueva imagen procesada');
    }

    // Convertir fecha si existe
    if (data.fecha) {
      updateData.fecha = Timestamp.fromDate(data.fecha);
    }

    await updateDoc(docRef, updateData);
  }

  // Cambiar estado del evento
  async cambiarEstado(eventoId: string, nuevoEstado: EventoEstado): Promise<void> {
    const docRef = doc(this.firestore, `eventos/${eventoId}`);
    await updateDoc(docRef, {
      estado: nuevoEstado,
      updatedAt: Timestamp.now()
    });
  }

  // Eliminar evento (soft delete)
  async eliminarEvento(eventoId: string): Promise<void> {
    await this.cambiarEstado(eventoId, 'cancelado');
  }

  // Obtener estadísticas del coordinador
  async getEstadisticasCoordinador(coordinadorUid: string): Promise<{
    totalEventos: number;
    eventosActivos: number;
    totalInscritos: number;
    horasCertificadas: number;
  }> {
    const q = query(
      this.eventosCollection,
      where('creadorUid', '==', coordinadorUid)
    );
    
    const snapshot = await getDocs(q);
    const eventos = snapshot.docs.map(doc => doc.data() as Evento);
    
    return {
      totalEventos: eventos.length,
      eventosActivos: eventos.filter(e => e.estado === 'publicado' || e.estado === 'en_curso').length,
      totalInscritos: eventos.reduce((sum, e) => sum + (e.inscritosCount || 0), 0),
      horasCertificadas: 0 // Se calculará desde inscripciones
    };
  }

  // Incrementar contador de inscritos
  async incrementarInscritos(eventoId: string): Promise<void> {
    const docRef = doc(this.firestore, `eventos/${eventoId}`);
    const eventoDoc = await getDoc(docRef);
    const evento = eventoDoc.data() as Evento;
    
    await updateDoc(docRef, {
      inscritosCount: (evento.inscritosCount || 0) + 1
    });
  }

  // Convertir Timestamps de Firestore a Dates
  private convertTimestamps(evento: any): Evento {
    return {
      ...evento,
      fecha: evento.fecha?.toDate ? evento.fecha.toDate() : new Date(evento.fecha),
      createdAt: evento.createdAt?.toDate ? evento.createdAt.toDate() : new Date(evento.createdAt),
      updatedAt: evento.updatedAt?.toDate ? evento.updatedAt.toDate() : new Date(evento.updatedAt)
    };
  }
}