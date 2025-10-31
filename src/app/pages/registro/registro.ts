import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrls: ['./registro.scss']
})
export class Registro {
  nombre = '';
  apellido = '';
  email = '';
  universidad = '';
  password = '';
  confirmPassword = '';
  acceptTerms = false;

  onRegister() {
    if (this.password !== this.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    if (!this.acceptTerms) {
      alert('Debes aceptar los términos y condiciones');
      return;
    }

    console.log('Registro:', {
      nombre: this.nombre,
      apellido: this.apellido,
      email: this.email,
      universidad: this.universidad
    });
    // Aquí irá la lógica de Firebase después
  }

  onGoogleRegister() {
    console.log('Registro con Google');
    // Aquí irá la lógica de Firebase después
  }

  onMicrosoftRegister() {
    console.log('Registro con Microsoft');
    // Aquí irá la lógica de Firebase después
  }
}