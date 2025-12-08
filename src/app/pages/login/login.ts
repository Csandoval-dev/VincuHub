// src/app/pages/login/login.ts

import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Propiedades del formulario
  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  
  // Estados
  loading = false;
  errorMessage = '';
  emailError = '';
  passwordError = '';

  ngOnInit(): void {
    // Establecer título de página para accesibilidad
    document.title = 'Iniciar Sesión - Vincu Hub';
    
    // Cargar email recordado si existe
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.email = rememberedEmail;
      this.rememberMe = true;
    }
  }

  ngOnDestroy(): void {
    // Cleanup si es necesario
  }

  /**
   * Valida el campo de email
   */
  validateEmail(): void {
    this.emailError = '';
    
    if (!this.email.trim()) {
      this.emailError = 'El correo electrónico es obligatorio';
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.emailError = 'Por favor ingresa un correo electrónico válido';
      return;
    }
  }

  /**
   * Valida el campo de contraseña
   */
  validatePassword(): void {
    this.passwordError = '';
    
    if (!this.password) {
      this.passwordError = 'La contraseña es obligatoria';
      return;
    }
    
    if (this.password.length < 6) {
      this.passwordError = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
  }

  /**
   * Verifica si el formulario es válido
   */
  isFormValid(): boolean {
    return this.email.trim() !== '' && 
           this.password !== '' && 
           this.password.length >= 6 &&
           !this.emailError &&
           !this.passwordError;
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
    
    // Anunciar el cambio a lectores de pantalla
    const announcement = this.showPassword 
      ? 'Contraseña visible' 
      : 'Contraseña oculta';
    this.announceToScreenReader(announcement);
  }

  /**
   * Maneja el envío del formulario de login
   */
  onLogin(): void {
    // Limpiar errores previos
    this.errorMessage = '';
    this.emailError = '';
    this.passwordError = '';

    // Validar campos
    this.validateEmail();
    this.validatePassword();

    if (!this.isFormValid()) {
      this.errorMessage = 'Por favor corrige los errores en el formulario';
      this.focusFirstError();
      return;
    }

    this.loading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        console.log('Login exitoso:', user);
        
        // Guardar email si "recordarme" está activo
        if (this.rememberMe) {
          localStorage.setItem('rememberedEmail', this.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        // Anunciar éxito
        this.announceToScreenReader('Inicio de sesión exitoso. Redirigiendo...');
        
        this.loading = false;
        // Redirigir según el rol
        this.authService.redirectToDashboard(user);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error en login:', error);
        
        // Mensajes de error personalizados y accesibles
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          this.errorMessage = 'Correo o contraseña incorrectos. Por favor verifica tus credenciales.';
        } else if (error.code === 'auth/invalid-email') {
          this.errorMessage = 'El formato del correo electrónico es inválido.';
        } else if (error.code === 'auth/too-many-requests') {
          this.errorMessage = 'Demasiados intentos fallidos. Por favor intenta más tarde.';
        } else if (error.code === 'auth/network-request-failed') {
          this.errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        } else {
          this.errorMessage = error.message || 'Error al iniciar sesión. Por favor intenta nuevamente.';
        }

        // Enfocar el mensaje de error para lectores de pantalla
        setTimeout(() => {
          const errorElement = document.getElementById('login-error');
          if (errorElement) {
            errorElement.focus();
          }
        }, 100);
      }
    });
  }

  /**
   * Maneja el login con Google
   */
  onGoogleLogin(): void {
    if (this.loading) return;
    
    this.loading = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle().subscribe({
      next: (user) => {
        console.log('Login con Google exitoso:', user);
        this.announceToScreenReader('Inicio de sesión con Google exitoso. Redirigiendo...');
        this.loading = false;
        this.authService.redirectToDashboard(user);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error en login con Google:', error);
        
        if (error.code === 'auth/popup-closed-by-user') {
          this.errorMessage = 'Inicio de sesión cancelado.';
        } else if (error.code === 'auth/popup-blocked') {
          this.errorMessage = 'Pop-up bloqueado. Por favor permite ventanas emergentes.';
        } else {
          this.errorMessage = 'Error al iniciar sesión con Google. Por favor intenta nuevamente.';
        }
      }
    });
  }

  /**
   * Maneja el login con Microsoft
   */
  onMicrosoftLogin(): void {
    if (this.loading) return;
    
    this.errorMessage = 'Inicio de sesión con Microsoft disponible próximamente.';
    this.announceToScreenReader(this.errorMessage);
    
    // Si implementas Microsoft en el futuro:
    /*
    this.loading = true;
    this.errorMessage = '';
    
    this.authService.loginWithMicrosoft().subscribe({
      next: (user) => {
        this.loading = false;
        this.authService.redirectToDashboard(user);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Error al iniciar sesión con Microsoft.';
      }
    });
    */
  }

  /**
   * Maneja el link de "olvidé mi contraseña"
   */
  onForgotPassword(event: Event): void {
    event.preventDefault();
    // Aquí puedes navegar a tu página de recuperación
    this.router.navigate(['/recuperar-password']);
    // O si no tienes esa ruta aún:
    // this.errorMessage = 'Función de recuperación de contraseña disponible próximamente.';
  }

  /**
   * Enfoca el primer campo con error
   */
  private focusFirstError(): void {
    setTimeout(() => {
      if (this.emailError) {
        const emailInput = document.getElementById('email');
        emailInput?.focus();
      } else if (this.passwordError) {
        const passwordInput = document.getElementById('password');
        passwordInput?.focus();
      }
    }, 100);
  }

  /**
   * Anuncia mensajes a lectores de pantalla usando un live region
   */
  private announceToScreenReader(message: string): void {
    // Crear o usar un elemento de anuncio existente
    let announcer = document.getElementById('sr-announcer');
    
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'sr-announcer';
      announcer.className = 'visually-hidden';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
    
    // Limpiar y establecer el nuevo mensaje
    announcer.textContent = '';
    setTimeout(() => {
      announcer!.textContent = message;
    }, 100);
  }
}