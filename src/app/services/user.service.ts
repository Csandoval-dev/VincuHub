import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { User, UserRole, CreateUserData } from '../models/user.model';
import { collectionData } from 'rxfire/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);

  constructor() {
    console.log('👥 UserService inicializado');
  }

  async createUserDocument(user: User): Promise<void> {
    console.log('💾 Guardando documento de usuario:', user.uid);
    try {
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userDocRef, user);
      console.log('✅ Documento de usuario creado exitosamente');
    } catch (error) {
      console.error('❌ Error al crear documento:', error);
      throw error;
    }
  }

  getAllUsers(): Observable<User[]> {
    console.log('📋 Obteniendo todos los usuarios...');
    const usersRef = collection(this.firestore, 'users');
    
    return from(getDocs(usersRef)).pipe(
      map(snapshot => {
        const users = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as User));
        console.log(`✅ ${users.length} usuarios obtenidos`);
        return users;
      })
    );
  }

  getUsersByRole(role: UserRole): Observable<User[]> {
    console.log('🔍 Buscando usuarios con rol:', role);
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('rol', '==', role), orderBy('createdAt', 'desc'));
    
    return from(getDocs(q)).pipe(
      map(snapshot => {
        const users = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as User));
        console.log(`✅ ${users.length} ${role}s encontrados`);
        return users;
      })
    );
  }

  async getUserById(uid: string): Promise<User | null> {
    console.log('🔍 Buscando usuario:', uid);
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        console.log('✅ Usuario encontrado');
        return { uid: userDoc.id, ...userDoc.data() } as User;
      } else {
        console.warn('⚠️ Usuario no encontrado');
        return null;
      }
    } catch (error) {
      console.error('❌ Error al buscar usuario:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    console.log('🔍 Buscando usuario por correo:', email);
    try {
      const usersRef = collection(this.firestore, 'users');
      const q = query(usersRef, where('correo', '==', email), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        console.log('✅ Usuario encontrado');
        const doc = querySnapshot.docs[0];
        return { uid: doc.id, ...doc.data() } as User;
      } else {
        console.warn('⚠️ Usuario no encontrado');
        return null;
      }
    } catch (error) {
      console.error('❌ Error al buscar usuario:', error);
      throw error;
    }
  }

async updateUser(uid: string, data: Partial<User>): Promise<void> {
  console.log('📝 Actualizando usuario:', uid);
  try {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined && v !== null)
    );
    const updateData = {
      ...cleanData,
      updatedAt: new Date()
    };
    await updateDoc(userDocRef, updateData);
    console.log('✅ Usuario actualizado exitosamente');
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error);
    throw error;
  }
}

  async deleteUserDocument(uid: string): Promise<void> {
    console.log('🗑️ Eliminando documento de usuario:', uid);
    try {
      const userDocRef = doc(this.firestore, `users/${uid}`);
      await deleteDoc(userDocRef);
      console.log('✅ Documento eliminado');
    } catch (error) {
      console.error('❌ Error al eliminar documento:', error);
      throw error;
    }
  }

  async deleteUser(uid: string): Promise<void> {
    console.log('🗑️ Eliminando usuario completo:', uid);
    try {
      await this.deleteUserDocument(uid);
      console.log('✅ Usuario eliminado de Firestore');
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      throw error;
    }
  }

  async getUserStats(): Promise<{
    total: number;
    estudiantes: number;
    coordinadores: number;
    admins: number;
  }> {
    console.log('📊 Calculando estadísticas de usuarios...');
    try {
      const usersRef = collection(this.firestore, 'users');
      const querySnapshot = await getDocs(usersRef);
      const users = querySnapshot.docs.map(doc => doc.data() as User);
      
      const stats = {
        total: users.length,
        estudiantes: users.filter(u => u.rol === 'estudiante').length,
        coordinadores: users.filter(u => u.rol === 'coordinador').length,
        admins: users.filter(u => u.rol === 'admin').length
      };
      
      console.log('✅ Estadísticas calculadas:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error al calcular estadísticas:', error);
      throw error;
    }
  }

  async emailExists(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      return user !== null;
    } catch (error) {
      console.error('❌ Error al verificar correo:', error);
      return false;
    }
  }

  async canDeleteUser(uid: string): Promise<{ canDelete: boolean; reason?: string }> {
    try {
      const user = await this.getUserById(uid);
      
      if (!user) {
        return { canDelete: false, reason: 'Usuario no encontrado' };
      }

      if (user.rol === 'admin') {
        const stats = await this.getUserStats();
        if (stats.admins <= 1) {
          return { 
            canDelete: false, 
            reason: 'No puedes eliminar el último administrador del sistema' 
          };
        }
      }

      return { canDelete: true };
    } catch (error) {
      console.error('❌ Error al verificar eliminación:', error);
      return { canDelete: false, reason: 'Error al verificar usuario' };
    }
  }

  // NUEVO MÉTODO
  async createUserDirectly(data: CreateUserData): Promise<void> {
    console.log('💾 Creando usuario en Firestore:', data.correo);
    
    try {
      const usersRef = collection(this.firestore, 'users');
      const newDocRef = doc(usersRef);
      const newId = newDocRef.id;
      
      const newUser: User = {
        uid: newId,
        nombre: data.nombre,
        apellido: data.apellido || '',
        correo: data.correo,
        rol: data.rol,
        carrera: data.carrera || '',
        campus: data.campus || '',
        horasVinculacionTotal: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        tempPassword: data.password,
        needsFirstLogin: true
      };
      
      await setDoc(doc(this.firestore, `users/${newId}`), newUser);
      console.log('✅ Usuario creado en Firestore');
      
    } catch (error) {
      console.error('❌ Error:', error);
      throw error;
    }
  }
}