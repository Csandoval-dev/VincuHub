import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User, CreateUserData, UserRole } from '../../models/user.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.html',
  styleUrls: ['./dashboard-admin.scss']
})
export class DashboardAdminComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  currentUser: User | null = null;
  loading = false;
  loadingUsers = false;
  message = '';
  isError = false;
  
  currentView: 'users' | 'create' = 'users';
  
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  filterRole: UserRole | 'todos' = 'todos';
  
  selectedUser: User | null = null;
  isEditing = false;
  showDeleteConfirm = false;
  
  newUser: CreateUserData = {
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    rol: 'coordinador',
    campus: ''
  };
  
  editUser: Partial<User> = {};
  
  private subscriptions: Subscription[] = [];

  campuses = ['Tegucigalpa', 'San Pedro Sula', 'La Ceiba', 'Choluteca'];
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

  ngOnInit() {
    console.log('🎯 Dashboard Admin inicializado');
    this.loadCurrentUser();
    this.loadAllUsers();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadCurrentUser() {
    const sub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('👤 Usuario actual:', user);
    });
    this.subscriptions.push(sub);
  }

  loadAllUsers() {
    this.loadingUsers = true;
    const sub = this.userService.getAllUsers().subscribe({
      next: (users) => {
        console.log('✅ Usuarios cargados:', users.length);
        this.allUsers = users;
        this.filterUsers();
        this.loadingUsers = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar usuarios:', error);
        this.showMessage('Error al cargar usuarios', true);
        this.loadingUsers = false;
      }
    });
    this.subscriptions.push(sub);
  }

  filterUsers() {
    let filtered = [...this.allUsers];
    
    if (this.filterRole !== 'todos') {
      filtered = filtered.filter(u => u.rol === this.filterRole);
    }
    
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.nombre?.toLowerCase().includes(term) ||
        u.apellido?.toLowerCase().includes(term) ||
        u.correo?.toLowerCase().includes(term) ||
        u.carrera?.toLowerCase().includes(term) ||
        u.campus?.toLowerCase().includes(term)
      );
    }
    
    this.filteredUsers = filtered;
  }

  onSearchChange() {
    this.filterUsers();
  }

  onFilterRoleChange() {
    this.filterUsers();
  }

  async createUser() {
    if (!this.newUser.nombre || !this.newUser.correo || !this.newUser.password) {
      this.showMessage('Por favor completa todos los campos requeridos', true);
      return;
    }

    if (this.newUser.rol === 'estudiante') {
      this.showMessage('Los estudiantes se registran desde la página pública', true);
      return;
    }

    if (this.newUser.password.length < 6) {
      this.showMessage('La contraseña debe tener al menos 6 caracteres', true);
      return;
    }

    this.loading = true;
    
    try {
      await this.userService.createUserDirectly(this.newUser);
      
      this.showMessage(`✅ Usuario ${this.newUser.nombre} creado exitosamente`, false);
      this.resetForm();
      this.loadAllUsers();
      this.currentView = 'users';
      
    } catch (error: any) {
      console.error('❌ Error:', error);
      this.showMessage('❌ Error: ' + error.message, true);
    }
    
    this.loading = false;
  }

  openEditUser(user: User) {
    this.selectedUser = user;
    this.isEditing = true;
    this.editUser = {
      nombre: user.nombre,
      apellido: user.apellido,
      correo: user.correo,
      rol: user.rol,
      carrera: user.carrera,
      campus: user.campus
    };
  }

  async saveEditUser() {
    if (!this.selectedUser) return;
    
    if (!this.editUser.nombre || !this.editUser.correo) {
      this.showMessage('Nombre y correo son requeridos', true);
      return;
    }

    this.loading = true;
    
    try {
      await this.userService.updateUser(this.selectedUser.uid, this.editUser);
      this.showMessage('Usuario actualizado exitosamente', false);
      this.cancelEdit();
      this.loadAllUsers();
      this.loading = false;
    } catch (error) {
      console.error('❌ Error:', error);
      this.showMessage('Error al actualizar usuario', true);
      this.loading = false;
    }
  }

  cancelEdit() {
    this.isEditing = false;
    this.selectedUser = null;
    this.editUser = {};
  }

  openDeleteConfirm(user: User) {
    this.selectedUser = user;
    this.showDeleteConfirm = true;
  }

  async confirmDelete() {
    if (!this.selectedUser) return;
    
    const validation = await this.userService.canDeleteUser(this.selectedUser.uid);
    
    if (!validation.canDelete) {
      this.showMessage(validation.reason || 'No se puede eliminar este usuario', true);
      this.cancelDelete();
      return;
    }
    
    this.loading = true;
    
    try {
      await this.userService.deleteUser(this.selectedUser.uid);
      this.showMessage('Usuario eliminado exitosamente', false);
      this.cancelDelete();
      this.loadAllUsers();
      this.loading = false;
    } catch (error) {
      console.error('❌ Error:', error);
      this.showMessage('Error al eliminar usuario', true);
      this.loading = false;
    }
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.selectedUser = null;
  }

  changeView(view: 'users' | 'create') {
    this.currentView = view;
    this.message = '';
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

  getRoleLabel(rol: UserRole): string {
    const labels: Record<UserRole, string> = {
      'estudiante': 'Estudiante',
      'coordinador': 'Coordinador',
      'admin': 'Administrador'
    };
    return labels[rol] || rol;
  }

  getRoleBadgeClass(rol: UserRole): string {
    const classes: Record<UserRole, string> = {
      'estudiante': 'badge-estudiante',
      'coordinador': 'badge-coordinador',
      'admin': 'badge-admin'
    };
    return classes[rol] || '';
  }

  logout() {
    this.authService.logout();
  }
}