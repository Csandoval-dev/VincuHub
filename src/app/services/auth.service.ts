import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  authState,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from '@angular/fire/auth';
import { 
  Firestore, 
  doc, 
  setDoc, 
  getDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  collection
} from '@angular/fire/firestore';
import { Observable, from, of, switchMap, tap, catchError } from 'rxjs';
import { User, UserRole, CreateUserData } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  constructor() {
    console.log('🔥 AuthService inicializado');
  }

  // ✅ SOLUCIÓN: Observable del usuario con getDoc en lugar de docData
  currentUser$: Observable<User | null> = authState(this.auth).pipe(
    tap(user => console.log('🔵 Estado de autenticación:', user?.uid || 'No autenticado')),
    switchMap((firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        console.log('❌ No hay usuario autenticado');
        return of(null);
      }
      
      console.log('✅ Usuario autenticado, obteniendo datos de Firestore...');
      
      // ✅ Usar from + getDoc en lugar de docData
      return from(
        getDoc(doc(this.firestore, `users/${firebaseUser.uid}`))
      ).pipe(
        tap(docSnap => console.log('📄 Documento obtenido:', docSnap.exists())),
        switchMap(docSnap => {
          if (!docSnap.exists()) {
            console.log('⚠️ Documento de usuario no existe');
            return of(null);
          }
          const userData = docSnap.data() as User;
          console.log('✅ Datos del usuario:', userData);
          return of(userData);
        }),
        catchError(error => {
          console.error('❌ Error al obtener datos de Firestore:', error);
          return of(null);
        })
      );
    })
  );

  // Registro de estudiante
  registerStudent(data: CreateUserData): Observable<User> {
    console.log('📝 Iniciando registro de estudiante:', data.correo);
    
    const auth = this.auth;
    const firestore = this.firestore;
    
    if (!data.rol || data.rol !== 'estudiante') {
      data.rol = 'estudiante';
    }

    return from(
      (async () => {
        try {
          console.log('🔐 Paso 1: Creando usuario en Auth...');
          const credential = await createUserWithEmailAndPassword(
            auth, 
            data.correo, 
            data.password
          );
          
          console.log('✅ Usuario creado en Auth:', credential.user.uid);

          const newUser: User = {
            uid: credential.user.uid,
            nombre: data.nombre,
            apellido: data.apellido || '',
            correo: data.correo,
            rol: 'estudiante',
            carrera: data.carrera || '',
            campus: data.campus || 'Ceutec',
            horasVinculacionTotal: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          console.log('💾 Paso 2: Guardando en Firestore...');
          const userDocRef = doc(firestore, `users/${credential.user.uid}`);
          await setDoc(userDocRef, newUser);
          
          console.log('✅ Usuario guardado en Firestore exitosamente');

          const savedDoc = await getDoc(userDocRef);
          if (savedDoc.exists()) {
            console.log('✅ Verificación exitosa');
          }

          return newUser;
          
        } catch (error: any) {
          console.error('❌ Error durante el registro:', error);
          throw error;
        }
      })()
    );
  }

  // Login con email y password
  login(email: string, password: string): Observable<User> {
    console.log('🔐 Login:', email);
    
    const auth = this.auth;
    const firestore = this.firestore;
    
    return from(
      (async () => {
        try {
          // Buscar usuario en Firestore primero
          const usersRef = collection(firestore, 'users');
          const q = query(usersRef, where('correo', '==', email));
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty) {
            throw new Error('Usuario no encontrado');
          }
          
          const userData = querySnapshot.docs[0].data() as User;
          
          // Si es primer login (creado por admin)
          if (userData.needsFirstLogin && userData.tempPassword === password) {
            console.log('🆕 Primer login - Creando cuenta en Authentication...');
            
            const credential = await createUserWithEmailAndPassword(
              auth,
              email,
              password
            );
            
            const oldDocRef = doc(firestore, `users/${userData.uid}`);
            const newDocRef = doc(firestore, `users/${credential.user.uid}`);
            
            const updatedUser = {
              ...userData,
              uid: credential.user.uid,
              needsFirstLogin: false,
              tempPassword: undefined,
              updatedAt: new Date()
            };
            
            await setDoc(newDocRef, updatedUser);
            await deleteDoc(oldDocRef);
            
            console.log('✅ Cuenta activada');
            return updatedUser;
          }
          
          // Login normal
          const credential = await signInWithEmailAndPassword(auth, email, password);
          const userDoc = await getDoc(doc(firestore, `users/${credential.user.uid}`));
          
          if (!userDoc.exists()) {
            throw new Error('Usuario no encontrado');
          }
          
          return userDoc.data() as User;
          
        } catch (error: any) {
          console.error('❌ Error login:', error);
          throw error;
        }
      })()
    );
  }

  // Login con Google
  loginWithGoogle(): Observable<User> {
    console.log('🔐 Iniciando login con Google...');
    
    const auth = this.auth;
    const firestore = this.firestore;
    const provider = new GoogleAuthProvider();
    
    return from(
      (async () => {
        try {
          const credential = await signInWithPopup(auth, provider);
          console.log('✅ Autenticación con Google exitosa:', credential.user.uid);
          
          const userDocRef = doc(firestore, `users/${credential.user.uid}`);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            console.log('📝 Usuario no existe, creando nuevo perfil...');
            const newUser: User = {
              uid: credential.user.uid,
              nombre: credential.user.displayName || 'Usuario',
              correo: credential.user.email || '',
              rol: 'estudiante',
              horasVinculacionTotal: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await setDoc(userDocRef, newUser);
            console.log('✅ Nuevo usuario creado con Google');
            return newUser;
          }
          
          console.log('✅ Usuario existente encontrado');
          return userDoc.data() as User;
          
        } catch (error: any) {
          console.error('❌ Error en login con Google:', error);
          throw error;
        }
      })()
    );
  }

  // Crear usuario (admin)
  createUser(data: CreateUserData): Observable<User> {
    console.log('📝 Admin creando usuario:', data.correo);
    
    const auth = this.auth;
    const firestore = this.firestore;
    
    return from(
      (async () => {
        try {
          const credential = await createUserWithEmailAndPassword(
            auth, 
            data.correo, 
            data.password
          );
          
          const newUser: User = {
            uid: credential.user.uid,
            nombre: data.nombre,
            apellido: data.apellido,
            correo: data.correo,
            rol: data.rol,
            carrera: data.carrera,
            campus: data.campus,
            horasVinculacionTotal: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          await setDoc(doc(firestore, `users/${credential.user.uid}`), newUser);
          console.log('✅ Usuario creado por admin');
          
          return newUser;
        } catch (error) {
          console.error('❌ Error al crear usuario:', error);
          throw error;
        }
      })()
    );
  }

  // Obtener datos del usuario actual
  async getCurrentUser(): Promise<User | null> {
    try {
      const firebaseUser = this.auth.currentUser;
      if (!firebaseUser) {
        console.log('ℹ️ No hay usuario actual');
        return null;
      }

      const userDoc = await getDoc(doc(this.firestore, `users/${firebaseUser.uid}`));
      return userDoc.exists() ? (userDoc.data() as User) : null;
    } catch (error) {
      console.error('❌ Error al obtener usuario actual:', error);
      return null;
    }
  }

  // Verificar rol
  async hasRole(role: UserRole): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user?.rol === role;
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      console.log('✅ Sesión cerrada');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    }
  }

  // Redirigir según rol
  async redirectToDashboard(user: User): Promise<void> {
    console.log('🔀 Redirigiendo usuario con rol:', user.rol);
    
    try {
      switch (user.rol) {
        case 'estudiante':
          await this.router.navigate(['/dashboard-alumno']);
          break;
        case 'coordinador':
          console.log('🔀 Navegando a dashboard-coordinador...');
          const result = await this.router.navigate(['/dashboard-coordinador']);
          console.log('🔀 Resultado navegación:', result);
          break;
        case 'admin':
          await this.router.navigate(['/dashboard-admin']);
          break;
        default:
          await this.router.navigate(['/inicio']);
      }
    } catch (error) {
      console.error('❌ Error en redirectToDashboard:', error);
    }
  }

  // Método de prueba para verificar conexión
  async testFirestoreConnection(): Promise<boolean> {
    try {
      console.log('🧪 Probando conexión a Firestore...');
      const testDocRef = doc(this.firestore, 'test/connection');
      await setDoc(testDocRef, { test: true, timestamp: new Date() });
      console.log('✅ Firestore está funcionando correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error de conexión a Firestore:', error);
      return false;
    }
  }
}