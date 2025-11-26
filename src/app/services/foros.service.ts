// src/app/services/foros.service.ts

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
  orderBy,
  Timestamp,
  onSnapshot
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { Foro, MensajeForo, CreateMensajeData } from '../models/foro.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ForosService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  // Crear foro automáticamente al crear evento
  async crearForoParaEvento(eventoId: string, tituloEvento: string): Promise<string> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const foro: Foro = {
      eventoId,
      titulo: `Foro: ${tituloEvento}`,
      descripcion: 'Espacio para comentarios y preguntas sobre este evento',
      creadorUid: user.uid,
      fechaCreacion: new Date(),
      cerrado: false,
      moderadorUid: user.uid,
      mensajesCount: 0
    };

    const docRef = await addDoc(collection(this.firestore, 'foros'), {
      ...foro,
      fechaCreacion: Timestamp.now()
    });

    // Actualizar con el ID
    await updateDoc(doc(this.firestore, `foros/${docRef.id}`), {
      foroId: docRef.id
    });

    return docRef.id;
  }

  // Obtener foro por evento
  async getForoByEvento(eventoId: string): Promise<Foro | null> {
    const q = query(
      collection(this.firestore, 'foros'),
      where('eventoId', '==', eventoId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const docSnap = snapshot.docs[0];
    return this.convertTimestamps({ 
      ...docSnap.data(), 
      foroId: docSnap.id 
    }) as Foro;
  }

  // ✅ MODIFICADO: Agregar mensaje sin campos undefined
  async agregarMensaje(foroId: string, data: CreateMensajeData): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const mensajesCollection = collection(this.firestore, `foros/${foroId}/mensajes`);
    
    // Crear objeto base sin campos undefined
    const mensajeData: any = {
      foroId,
      uid: user.uid,
      nombreUsuario: `${user.nombre} ${user.apellido || ''}`.trim(),
      rolUsuario: user.rol,
      contenido: data.contenido,
      fecha: Timestamp.now(),
      editado: false,
      eliminado: false
    };

    // Solo agregar fotoUsuario si existe
    if (user.fotoUrl) {
      mensajeData.fotoUsuario = user.fotoUrl;
    }

    await addDoc(mensajesCollection, mensajeData);

    // Incrementar contador de mensajes
    const foroRef = doc(this.firestore, `foros/${foroId}`);
    const foroDoc = await getDoc(foroRef);
    
    if (foroDoc.exists()) {
      const foroData = foroDoc.data() as Foro;
      await updateDoc(foroRef, {
        mensajesCount: (foroData.mensajesCount || 0) + 1
      });
    }
  }

  // ✅ MODIFICADO: Obtener mensajes en tiempo real con onSnapshot
  getMensajesByForo(foroId: string): Observable<MensajeForo[]> {
    return new Observable<MensajeForo[]>(subscriber => {
      const mensajesCollection = collection(this.firestore, `foros/${foroId}/mensajes`);
      const q = query(mensajesCollection, orderBy('fecha', 'asc'));
      
      // Escuchar cambios en tiempo real
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const mensajes = snapshot.docs
            .map(doc => {
              const data = doc.data();
              return this.convertTimestamps({
                ...data,
                mensajeId: doc.id
              });
            })
            .filter(m => !m.eliminado);
          
          console.log('🔥 Snapshot actualizado:', mensajes.length, 'mensajes');
          subscriber.next(mensajes);
        },
        (error) => {
          console.error('❌ Error en listener de mensajes:', error);
          subscriber.error(error);
        }
      );
      
      // Cleanup cuando el observable se desuscriba
      return () => {
        console.log('🧹 Deteniendo listener de mensajes');
        unsubscribe();
      };
    });
  }

  // Eliminar mensaje (moderador)
  async eliminarMensaje(foroId: string, mensajeId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    // Verificar si es moderador o admin
    if (user.rol !== 'coordinador' && user.rol !== 'admin') {
      throw new Error('Solo moderadores pueden eliminar mensajes');
    }

    const mensajeRef = doc(this.firestore, `foros/${foroId}/mensajes/${mensajeId}`);
    
    // Soft delete
    await updateDoc(mensajeRef, {
      eliminado: true,
      contenido: '[Mensaje eliminado por el moderador]'
    });
  }

  // Cerrar foro (coordinador)
  async cerrarForo(foroId: string): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');
    if (user.rol !== 'coordinador' && user.rol !== 'admin') {
      throw new Error('Solo coordinadores pueden cerrar foros');
    }

    const foroRef = doc(this.firestore, `foros/${foroId}`);
    await updateDoc(foroRef, {
      cerrado: true
    });
  }

  private convertTimestamps(data: any): any {
    return {
      ...data,
      fechaCreacion: data.fechaCreacion?.toDate 
        ? data.fechaCreacion.toDate() 
        : data.fechaCreacion 
          ? new Date(data.fechaCreacion)
          : undefined,
      fecha: data.fecha?.toDate 
        ? data.fecha.toDate() 
        : data.fecha
          ? new Date(data.fecha)
          : undefined
    };
  }
}