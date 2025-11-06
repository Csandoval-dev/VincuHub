export type UserRole = 'estudiante' | 'coordinador' | 'admin';

export interface User {
  uid: string;
  nombre: string;
  apellido?: string;
  correo: string;
  rol: UserRole;
  carrera?: string;
  campus?: string;
  universidad?: string; 
  horasVinculacionTotal: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserData {
  nombre: string;
  apellido?: string;
  correo: string;
  password: string;
  rol: UserRole;
  carrera?: string;
  campus?: string;
  universidad?: string; 
}
