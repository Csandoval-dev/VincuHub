
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
  docData,
  collection,
  collectionData
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
    console.log('🔥 Firebase Auth:', this.auth);
    console.log('🔥 Firestore:', this.firestore);
  }

  // Observable del usuario autenticado
  currentUser$: Observable<User | null> = authState(this.auth).pipe(
    tap(user => console.log('🔵 Estado de autenticación:', user?.uid || 'No autenticado')),
    switchMap((firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        console.log('❌ No hay usuario autenticado');
        return of(null);
      }
      
      console.log('✅ Usuario autenticado, obteniendo datos de Firestore...');
      const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
      
      return docData(userDocRef).pipe(
        tap(data => console.log('📄 Datos obtenidos de Firestore:', data)),
        // Map the document data to User type, or null if not found
        switchMap((data: any) => {
          if (!data) {
            return of(null);
          }
          // If you need to ensure the object matches User, you can do additional mapping here
          return of(data as User);
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
    
    // Validación del rol
    if (!data.rol || data.rol !== 'estudiante') {
      data.rol = 'estudiante';
    }

    return from(
      (async () => {
        try {
          // 1. Crear usuario en Authentication
          console.log('🔐 Paso 1: Creando usuario en Auth...');
          const credential = await createUserWithEmailAndPassword(
            this.auth, 
            data.correo, 
            data.password
          );
          
          console.log('✅ Usuario creado en Auth:', credential.user.uid);

          // 2. Preparar datos del usuario
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

          console.log('📦 Datos del usuario a guardar:', newUser);

          // 3. Guardar en Firestore
          console.log('💾 Paso 2: Guardando en Firestore...');
          const userDocRef = doc(this.firestore, `users/${credential.user.uid}`);
          
          await setDoc(userDocRef, newUser);
          
          console.log('✅ Usuario guardado en Firestore exitosamente');

          // 4. Verificar que se guardó correctamente
          console.log('🔍 Paso 3: Verificando datos guardados...');
          const savedDoc = await getDoc(userDocRef);
          
          if (savedDoc.exists()) {
            console.log('✅ Verificación exitosa. Usuario registrado correctamente');
            console.log('📄 Datos verificados:', savedDoc.data());
          } else {
            console.warn('⚠️ El documento no se encontró después de guardarlo');
          }

          return newUser;
          
        } catch (error: any) {
          console.error('❌ Error durante el registro:', error);
          console.error('📋 Código de error:', error.code);
          console.error('📋 Mensaje:', error.message);
          throw error;
        }
      })()
    );
  }

  // Login con email y password
  login(email: string, password: string): Observable<User> {
    console.log('🔐 Intentando login con:', email);
    
    return from(
      (async () => {
        try {
          // 1. Autenticar
          console.log('🔑 Paso 1: Autenticando...');
          const credential = await signInWithEmailAndPassword(this.auth, email, password);
          console.log('✅ Autenticación exitosa, UID:', credential.user.uid);
          
          // 2. Obtener datos de Firestore
          console.log('📄 Paso 2: Obteniendo datos de Firestore...');
          const userDocRef = doc(this.firestore, `users/${credential.user.uid}`);
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            console.error('❌ Usuario no encontrado en Firestore');
            throw new Error('Usuario no encontrado en la base de datos');
          }
          
          const userData = userDoc.data() as User;
          console.log('✅ Datos del usuario obtenidos:', userData);
          
          return userData;
          
        } catch (error: any) {
          console.error('❌ Error durante el login:', error);
          console.error('📋 Código de error:', error.code);
          throw error;
        }
      })()
    );
  }

  // Login con Google
  loginWithGoogle(): Observable<User> {
    console.log('🔐 Iniciando login con Google...');
    const provider = new GoogleAuthProvider();
    
    return from(
      (async () => {
        try {
          const credential = await signInWithPopup(this.auth, provider);
          console.log('✅ Autenticación con Google exitosa:', credential.user.uid);
          
          const userDocRef = doc(this.firestore, `users/${credential.user.uid}`);
          const userDoc = await getDoc(userDocRef);
          
          // Si el usuario no existe, crear uno nuevo como estudiante
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
    
    return from(
      (async () => {
        try {
          const credential = await createUserWithEmailAndPassword(
            this.auth, 
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

          await setDoc(doc(this.firestore, `users/${credential.user.uid}`), newUser);
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
    
    switch (user.rol) {
      case 'estudiante':
        await this.router.navigate(['/dashboard-alumno']);
        break;
      case 'coordinador':
        await this.router.navigate(['/dashboard-coordinador']);
        break;
      case 'admin':
        await this.router.navigate(['/dashboard-admin']);
        break;
      default:
        await this.router.navigate(['/inicio']);
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