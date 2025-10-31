import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './header.html',  
  styleUrls: ['./header.scss']   
})
export class HeaderComponent {
  isMenuOpen = false;
  showAuthModal = false;
  authMode: 'login' | 'registro' = 'login';

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  openAuthModal(mode: 'login' | 'registro') {
    this.authMode = mode;
    this.showAuthModal = true;
  }

  closeAuthModal() {
    this.showAuthModal = false;
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}