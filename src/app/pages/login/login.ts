import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  email = '';
  password = '';
  rememberMe = false;

  onLogin() {
    console.log('Login:', this.email);
    // Aquí irá la lógica de Firebase después
  }

  onGoogleLogin() {
    console.log('Login con Google');
    // Aquí irá la lógica de Firebase después
  }

  onMicrosoftLogin() {
    console.log('Login con Microsoft');
    // Aquí irá la lógica de Firebase después
  }
}