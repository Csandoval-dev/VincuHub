import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-section.html',
  styleUrls: ['./hero-section.scss']
})
export class HeroSectionComponent implements OnInit {
  
  stats = [
    { number: '500+', label: 'Eventos Realizados' },
    { number: '50+', label: 'Universidades' },
    { number: '10K+', label: 'Estudiantes' },
    { number: '200+', label: 'Proyectos Activos' }
  ];

  currentTextIndex = 0;
  rotatingTexts = [
    'Eventos Académicos',
    'Proyectos de Vinculación',
    'Congresos Universitarios',
    'Ferias Científicas'
  ];
  displayText = this.rotatingTexts[0];

  ngOnInit() {
    this.startTextRotation();
  }

  startTextRotation() {
    setInterval(() => {
      this.currentTextIndex = (this.currentTextIndex + 1) % this.rotatingTexts.length;
      this.displayText = this.rotatingTexts[this.currentTextIndex];
    }, 3000);
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}