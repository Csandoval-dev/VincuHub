// src/app/services/inscripciones.service.ts

import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
  runTransaction
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Inscripcion, UpdateAsistenciaData } from '../models/inscripcion.model';
import { AuthService } from './auth.service';
import { EventosService } from './eventos.service';

@Injectable({
  providedIn: 'root'
})
export class InscripcionesService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private eventosService = inject(EventosService);

  private inscripcionesCollection = collection(this.firestore, 'inscripciones');

  // Inscribir estudiante a evento
  async inscribirEstudiante(eventoId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');
    if (user.rol !== 'estudiante') throw new Error('Solo estudiantes pueden inscribirse');

    // Verificar si ya está inscrito
    const q = query(
      this.inscripcionesCollection,
      where('uid', '==', user.uid),
      where('eventoId', '==', eventoId)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      throw new Error('Ya estás inscrito en este evento');
    }

    const inscripcion: Inscripcion = {
      uid: user.uid,
      eventoId,
      nombreEstudiante: `${user.nombre} ${user.apellido || ''}`.trim(),
      correoEstudiante: user.correo,
      carrera: user.carrera,
      fechaInscripcion: new Date(),
      asistencia: false,
      horasGanadas: 0
    };

    await addDoc(this.inscripcionesCollection, {
      ...inscripcion,
      fechaInscripcion: Timestamp.now()
    });

    // Incrementar contador en evento
    await this.eventosService.incrementarInscritos(eventoId);
  }

  // ✅ CORREGIDO: Obtener inscripciones de un evento
  getInscripcionesByEvento(eventoId: string): Observable<Inscripcion[]> {
    const firestore = this.firestore; // Guardar referencia
    
    return from(
      (async () => {
        const q = query(
          collection(firestore, 'inscripciones'),
          where('eventoId', '==', eventoId)
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return this.convertTimestamps({
            ...data,
            inscripcionId: doc.id
          });
        });
      })()
    );
  }

  // ✅ CORREGIDO: Obtener inscripciones de un estudiante
  getInscripcionesByEstudiante(uid: string): Observable<Inscripcion[]> {
    const firestore = this.firestore; // Guardar referencia
    
    return from(
      (async () => {
        const q = query(
          collection(firestore, 'inscripciones'),
          where('uid', '==', uid)
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return this.convertTimestamps({
            ...data,
            inscripcionId: doc.id
          });
        });
      })()
    );
  }

  // Registrar asistencia (coordinador)
  async registrarAsistencia(data: UpdateAsistenciaData): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');
    if (user.rol !== 'coordinador' && user.rol !== 'admin') {
      throw new Error('Solo coordinadores pueden registrar asistencia');
    }

    const docRef = doc(this.firestore, `inscripciones/${data.inscripcionId}`);
    const inscripcionDoc = await getDoc(docRef);
    
    if (!inscripcionDoc.exists()) {
      throw new Error('Inscripción no encontrada');
    }

    const inscripcion = inscripcionDoc.data() as Inscripcion;

    // Usar transacción para actualizar horas del estudiante
    await runTransaction(this.firestore, async (transaction) => {
      // Actualizar inscripción
      transaction.update(docRef, {
        asistencia: data.asistencia,
        horasGanadas: data.horasGanadas,
        registradoPor: user.uid,
        fechaRegistroAsistencia: Timestamp.now(),
        comentarios: data.comentarios || ''
      });

      // Si asistió, actualizar horas totales del estudiante
      if (data.asistencia && data.horasGanadas > 0) {
        const userRef = doc(this.firestore, `users/${inscripcion.uid}`);
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data();
        
        const horasTotales = (userData?.['horasVinculacionTotal'] || 0) + data.horasGanadas;
        transaction.update(userRef, {
          horasVinculacionTotal: horasTotales
        });
      }
    });
  }

  // Registrar asistencias múltiples
  async registrarAsistenciasMultiples(asistencias: UpdateAsistenciaData[]): Promise<void> {
    const promises = asistencias.map(data => this.registrarAsistencia(data));
    await Promise.all(promises);
  }

  // Verificar si estudiante está inscrito
  async estaInscrito(uid: string, eventoId: string): Promise<boolean> {
    const q = query(
      this.inscripcionesCollection,
      where('uid', '==', uid),
      where('eventoId', '==', eventoId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  // Obtener total de horas certificadas por coordinador
  async getHorasCertificadasByCoordinador(coordinadorUid: string): Promise<number> {
    // Obtener eventos del coordinador
    const eventosQuery = query(
      collection(this.firestore, 'eventos'),
      where('creadorUid', '==', coordinadorUid)
    );
    const eventosSnapshot = await getDocs(eventosQuery);
    const eventosIds = eventosSnapshot.docs.map(doc => doc.id);

    if (eventosIds.length === 0) return 0;

    // Obtener inscripciones con asistencia de esos eventos
    // Firestore limita 'in' a 10 elementos, así que dividir en batches
    let totalHoras = 0;
    
    for (let i = 0; i < eventosIds.length; i += 10) {
      const batch = eventosIds.slice(i, i + 10);
      
      const inscripcionesQuery = query(
        this.inscripcionesCollection,
        where('eventoId', 'in', batch),
        where('asistencia', '==', true)
      );
      
      const inscripcionesSnapshot = await getDocs(inscripcionesQuery);
      
      inscripcionesSnapshot.forEach(doc => {
        const inscripcion = doc.data() as Inscripcion;
        totalHoras += inscripcion.horasGanadas || 0;
      });
    }

    return totalHoras;
  }

  private convertTimestamps(inscripcion: any): Inscripcion {
    return {
      ...inscripcion,
      fechaInscripcion: inscripcion.fechaInscripcion?.toDate 
        ? inscripcion.fechaInscripcion.toDate() 
        : new Date(inscripcion.fechaInscripcion),
      fechaRegistroAsistencia: inscripcion.fechaRegistroAsistencia?.toDate 
        ? inscripcion.fechaRegistroAsistencia.toDate() 
        : inscripcion.fechaRegistroAsistencia 
          ? new Date(inscripcion.fechaRegistroAsistencia)
          : undefined
    };
  }
}