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
  collectionData,
  docData,
  Timestamp
} from '@angular/fire/firestore';
import { 
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from '@angular/fire/storage';
import { Observable, from, map } from 'rxjs';
import { Evento, CreateEventoData, EventoEstado } from '../models/evento.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EventosService {
  private firestore = inject(Firestore);
  private storage = inject(Storage);
  private authService = inject(AuthService);

  private eventosCollection = collection(this.firestore, 'eventos');

  // Crear evento
  async crearEvento(data: CreateEventoData, imagenFile?: File): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    let imagenUrl = '';
    
    // Subir imagen si existe
    if (imagenFile) {
      const timestamp = Date.now();
      const imagePath = `eventos/${timestamp}_${imagenFile.name}`;
      const storageRef = ref(this.storage, imagePath);
      await uploadBytes(storageRef, imagenFile);
      imagenUrl = await getDownloadURL(storageRef);
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

  // Obtener eventos del coordinador
  getEventosByCoordinador(coordinadorUid: string): Observable<Evento[]> {
    const q = query(
      this.eventosCollection,
      where('creadorUid', '==', coordinadorUid),
      orderBy('fecha', 'desc')
    );

    return collectionData(q, { idField: 'eventoId' }).pipe(
      map((eventos: any[]) => eventos.map(e => this.convertTimestamps(e)))
    );
  }

  // Obtener todos los eventos (para estudiantes)
  getEventosPublicados(campus?: string): Observable<Evento[]> {
    let q = query(
      this.eventosCollection,
      where('estado', '==', 'publicado'),
      orderBy('fecha', 'asc')
    );

    if (campus) {
      q = query(q, where('campus', '==', campus));
    }

    return collectionData(q, { idField: 'eventoId' }).pipe(
      map((eventos: any[]) => eventos.map(e => this.convertTimestamps(e)))
    );
  }

  // Obtener evento por ID
  getEventoById(eventoId: string): Observable<Evento | null> {
    const docRef = doc(this.firestore, `eventos/${eventoId}`);
    return docData(docRef, { idField: 'eventoId' }).pipe(
      map((evento: any) => evento ? this.convertTimestamps(evento) : null)
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
      // Eliminar imagen anterior si existe
      const eventoActual = await getDoc(docRef);
      const eventoData = eventoActual.data() as Evento;
      
      if (eventoData.imagenUrl) {
        try {
          const oldImageRef = ref(this.storage, eventoData.imagenUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.warn('No se pudo eliminar la imagen anterior:', error);
        }
      }

      // Subir nueva imagen
      const timestamp = Date.now();
      const imagePath = `eventos/${timestamp}_${imagenFile.name}`;
      const storageRef = ref(this.storage, imagePath);
      await uploadBytes(storageRef, imagenFile);
      updateData.imagenUrl = await getDownloadURL(storageRef);
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
      fecha: evento.fecha?.toDate ? evento.fecha.toDate() : evento.fecha,
      createdAt: evento.createdAt?.toDate ? evento.createdAt.toDate() : evento.createdAt,
      updatedAt: evento.updatedAt?.toDate ? evento.updatedAt.toDate() : evento.updatedAt
    };
  }
}