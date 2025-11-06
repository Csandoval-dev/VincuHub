// ============================================
// registro.component.ts - VERSIÓN MEJORADA
// ============================================
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CreateUserData } from '../../models/user.model';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrls: ['./registro.scss']
})
export class Registro implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  nombre = '';
  apellido = '';
  email = '';
  carrera = '';
  campus = '';
  password = '';
  confirmPassword = '';
  acceptTerms = false;
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Carreras CEUTEC
  carreras = [
    'Ingeniería en Informatica',
    'Ingeniería Industrial',
    'Ingeniería Civil',
    'Administración de Empresas',
    'Contaduría Pública y Finanzas',
    'Mercadotecnia',
    'Derecho',
    'Psicología',
    'Diseño Gráfico',
    'Arquitectura'
  ];

  // Campus CEUTEC
  campuses = ['Tegucigalpa', 'San Pedro Sula', 'La Ceiba', 'Choluteca'];

  ngOnInit() {
    console.log('🎯 Componente Registro inicializado');
    // Prueba de conexión a Firestore
    this.authService.testFirestoreConnection().then(result => {
      if (result) {
        console.log('✅ Firestore está conectado y funcionando');
      } else {
        console.error('❌ Problema con la conexión a Firestore');
      }
    });
  }

  onRegister() {
    console.log('🚀 Formulario de registro enviado');
    
    // Validaciones básicas
    if (!this.nombre || !this.email || !this.password || !this.carrera || !this.campus) {
      this.errorMessage = 'Por favor completa todos los campos requeridos';
      console.warn('⚠️ Campos incompletos');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      console.warn('⚠️ Las contraseñas no coinciden');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      console.warn('⚠️ Contraseña muy corta');
      return;
    }

    if (!this.acceptTerms) {
      this.errorMessage = 'Debes aceptar los términos y condiciones';
      console.warn('⚠️ Términos no aceptados');
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userData: CreateUserData = {
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      correo: this.email.trim().toLowerCase(),
      password: this.password,
      rol: 'estudiante',
      carrera: this.carrera,
      campus: this.campus
    };

    console.log('📦 Datos a registrar:', { ...userData, password: '***' });

    this.authService.registerStudent(userData).subscribe({
      next: (user) => {
        console.log('🎉 ¡Registro exitoso!', user);
        this.loading = false;
        this.successMessage = '¡Registro exitoso! Redirigiendo al dashboard...';

        setTimeout(() => {
          this.authService.redirectToDashboard(user);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Error en el registro:', error);
        console.error('📋 Código de error:', error.code);
        console.error('📋 Mensaje completo:', error.message);
        
        // Mensajes de error personalizados
        if (error.code === 'auth/email-already-in-use') {
          this.errorMessage = 'Este correo ya está registrado. Intenta iniciar sesión.';
        } else if (error.code === 'auth/invalid-email') {
          this.errorMessage = 'El formato del correo electrónico es inválido';
        } else if (error.code === 'auth/weak-password') {
          this.errorMessage = 'La contraseña es muy débil. Usa al menos 6 caracteres.';
        } else if (error.code === 'permission-denied') {
          this.errorMessage = 'Error de permisos en Firestore. Verifica las reglas de seguridad.';
        } else if (error.message?.includes('Missing or insufficient permissions')) {
          this.errorMessage = 'Error de permisos en Firestore. Contacta al administrador.';
        } else {
          this.errorMessage = error.message || 'Error al registrarse. Intenta nuevamente.';
        }
      }
    });
  }

  onGoogleRegister() {
    console.log('🔐 Registro con Google iniciado');
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.loginWithGoogle().subscribe({
      next: (user) => {
        console.log('🎉 Registro con Google exitoso:', user);
        this.loading = false;
        this.successMessage = '¡Registro exitoso! Redirigiendo...';
        
        setTimeout(() => {
          this.authService.redirectToDashboard(user);
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        console.error('❌ Error en registro con Google:', error);
        this.errorMessage = 'Error al registrarse con Google. Intenta nuevamente.';
      }
    });
  }

  onMicrosoftRegister() {
    console.log('ℹ️ Microsoft login no implementado aún');
    this.errorMessage = 'Registro con Microsoft disponible próximamente';
  }

  // Método para testing - puedes llamarlo desde la consola del navegador
  testConnection() {
    console.log('🧪 Ejecutando prueba de conexión...');
    this.authService.testFirestoreConnection();
  }
}