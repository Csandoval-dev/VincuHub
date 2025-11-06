
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User, CreateUserData } from '../../models/user.model';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.html',
  styleUrls: ['./dashboard-admin.scss']
})
export class DashboardAdminComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser: User | null = null;
  loading = false;
  message = '';
  isError = false;

  newUser: CreateUserData = {
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    rol: 'coordinador',
    campus: ''
  };

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  createUser() {
    if (!this.newUser.nombre || !this.newUser.correo || !this.newUser.password || !this.newUser.rol) {
      this.showMessage('Por favor completa todos los campos requeridos', true);
      return;
    }

    if (this.newUser.rol === 'estudiante') {
      this.showMessage('Los estudiantes se registran desde la página de registro público', true);
      return;
    }

    this.loading = true;
    this.authService.createUser(this.newUser).subscribe({
      next: (user) => {
        this.showMessage(`Usuario ${user.nombre} creado exitosamente`, false);
        this.resetForm();
        this.loading = false;
      },
      error: (error) => {
        this.showMessage(`Error al crear usuario: ${error.message}`, true);
        this.loading = false;
      }
    });
  }

  resetForm() {
    this.newUser = {
      nombre: '',
      apellido: '',
      correo: '',
      password: '',
      rol: 'coordinador',
      campus: ''
    };
    this.message = '';
  }

  showMessage(msg: string, error: boolean) {
    this.message = msg;
    this.isError = error;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  logout() {
    this.authService.logout();
  }
}