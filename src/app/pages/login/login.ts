// src/app/pages/login/login.ts

import { Component, inject } from '@angular/core';
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
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  rememberMe = false;
  loading = false;
  errorMessage = '';

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        console.log('Login exitoso:', user);
        this.loading = false;
        // Redirigir según el rol
        this.authService.redirectToDashboard(user);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error en login:', error);
        
        // Mensajes de error personalizados
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          this.errorMessage = 'Correo o contraseña incorrectos';
        } else if (error.code === 'auth/invalid-email') {
          this.errorMessage = 'Correo electrónico inválido';
        } else if (error.code === 'auth/too-many-requests') {
          this.errorMessage = 'Demasiados intentos. Intenta más tarde';
        } else {
          this.errorMessage = error.message || 'Error al iniciar sesión';
        }
      }
    });
  }

  onGoogleLogin() {
    this.loading = true;
    this.errorMessage = '';

    this.authService.loginWithGoogle().subscribe({
      next: (user) => {
        console.log('Login con Google exitoso:', user);
        this.loading = false;
        this.authService.redirectToDashboard(user);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error en login con Google:', error);
        this.errorMessage = 'Error al iniciar sesión con Google';
      }
    });
  }

  onMicrosoftLogin() {
    this.errorMessage = 'Inicio de sesión con Microsoft disponible próximamente';
  }
}