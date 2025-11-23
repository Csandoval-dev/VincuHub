// src/app/services/foros.service.ts

import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  collectionData,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { Foro, MensajeForo, CreateMensajeData } from '../models/foro.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ForosService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private forosCollection = collection(this.firestore, 'foros');

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

    const docRef = await addDoc(this.forosCollection, {
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
      this.forosCollection,
      where('eventoId', '==', eventoId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return this.convertTimestamps({ ...doc.data(), foroId: doc.id }) as Foro;
  }

  // Agregar mensaje al foro
  async agregarMensaje(foroId: string, data: CreateMensajeData): Promise<void> {
    const user = await this.authService.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const mensajesCollection = collection(this.firestore, `foros/${foroId}/mensajes`);
    
    const mensaje: MensajeForo = {
      foroId,
      uid: user.uid,
      nombreUsuario: `${user.nombre} ${user.apellido || ''}`.trim(),
      rolUsuario: user.rol,
      fotoUsuario: user.fotoUrl,
      contenido: data.contenido,
      fecha: new Date(),
      editado: false,
      eliminado: false
    };

    await addDoc(mensajesCollection, {
      ...mensaje,
      fecha: Timestamp.now()
    });

    // Incrementar contador de mensajes
    const foroRef = doc(this.firestore, `foros/${foroId}`);
    const foroDoc = await getDocs(query(collection(this.firestore, 'foros'), where('foroId', '==', foroId)));
    const foroData = foroDoc.docs[0]?.data() as Foro;
    
    await updateDoc(foroRef, {
      mensajesCount: (foroData.mensajesCount || 0) + 1
    });
  }

  // Obtener mensajes del foro
  getMensajesByForo(foroId: string): Observable<MensajeForo[]> {
    const mensajesCollection = collection(this.firestore, `foros/${foroId}/mensajes`);
    const q = query(mensajesCollection, orderBy('fecha', 'asc'));

    return collectionData(q, { idField: 'mensajeId' }).pipe(
      map((mensajes: any[]) => 
        mensajes
          .filter(m => !m.eliminado)
          .map(m => this.convertTimestamps(m))
      )
    );
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
      fechaCreacion: data.fechaCreacion?.toDate ? data.fechaCreacion.toDate() : data.fechaCreacion,
      fecha: data.fecha?.toDate ? data.fecha.toDate() : data.fecha
    };
  }
}