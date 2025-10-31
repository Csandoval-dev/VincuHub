import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss']
})
export class FooterComponent {
  
  currentYear = new Date().getFullYear();
  
  navigationLinks = [
    { label: 'Inicio', url: '#inicio' },
    { label: 'Eventos', url: '#eventos' },
    { label: 'Proyectos', url: '#proyectos' },
    { label: 'Vinculación', url: '#vinculacion' }
  ];

  resourceLinks = [
    { label: 'Blog', url: '#blog' },
    { label: 'Documentación', url: '#docs' },
    { label: 'Centro de Ayuda', url: '#ayuda' },
    { label: 'API', url: '#api' }
  ];

  legalLinks = [
    { label: 'Términos de Servicio', url: '#terminos' },
    { label: 'Política de Privacidad', url: '#privacidad' },
    { label: 'Cookies', url: '#cookies' },
    { label: 'Contacto', url: '#contacto' }
  ];

  socialLinks = [
    { name: 'Facebook', icon: 'F', url: '#', color: '#1877f2' },
    { name: 'Twitter', icon: 'X', url: '#', color: '#1da1f2' },
    { name: 'Instagram', icon: 'I', url: '#', color: '#e4405f' },
    { name: 'LinkedIn', icon: 'in', url: '#', color: '#0a66c2' },
    { name: 'YouTube', icon: 'Y', url: '#', color: '#ff0000' }
  ];

  subscribeEmail = '';

  onSubscribe() {
    if (this.subscribeEmail) {
      console.log('Suscripción:', this.subscribeEmail);
      alert('¡Gracias por suscribirte! Te mantendremos informado.');
      this.subscribeEmail = '';
    }
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}