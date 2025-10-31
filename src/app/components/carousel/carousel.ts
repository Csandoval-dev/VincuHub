import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  university: string;
  category: string;
  image: string;
  attendees: number;
}

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel.html',
  styleUrls: ['./carousel.scss']
})
export class CarouselComponent implements OnInit, OnDestroy {
  
  currentIndex = 0;
  autoSlideInterval: any;
  
  events: Event[] = [
    {
      id: 1,
      title: 'Congreso Internacional de Tecnología',
      description: 'Únete a expertos de todo el mundo para discutir las últimas tendencias en tecnología, inteligencia artificial y desarrollo sostenible.',
      date: '15 Nov 2025',
      location: 'Auditorio Principal',
      university: 'UNAH',
      category: 'Tecnología',
      image: '🚀',
      attendees: 450
    },
    {
      id: 2,
      title: 'Feria de Proyectos de Vinculación',
      description: 'Presentación de proyectos que conectan la universidad con la comunidad. Innovación social y desarrollo comunitario.',
      date: '20 Nov 2025',
      location: 'Campus Central',
      university: 'UNITEC',
      category: 'Vinculación',
      image: '🤝',
      attendees: 320
    },
    {
      id: 3,
      title: 'Simposio de Ciencias Ambientales',
      description: 'Investigación y acción sobre cambio climático, biodiversidad y conservación. Construyendo un futuro sostenible.',
      date: '25 Nov 2025',
      location: 'Centro de Investigación',
      university: 'UPNFM',
      category: 'Ciencias',
      image: '🌱',
      attendees: 280
    },
    {
      id: 4,
      title: 'Hackathon Universitario 2025',
      description: '48 horas de innovación. Desarrolla soluciones tecnológicas para problemas reales. Premios y oportunidades laborales.',
      date: '30 Nov 2025',
      location: 'Lab de Innovación',
      university: 'CEUTEC',
      category: 'Tecnología',
      image: '💻',
      attendees: 180
    },
    {
      id: 5,
      title: 'Encuentro de Emprendimiento Social',
      description: 'Conecta con emprendedores sociales, inversionistas y mentores. Transforma ideas en proyectos de impacto.',
      date: '5 Dic 2025',
      location: 'Centro de Emprendimiento',
      university: 'UNITEC',
      category: 'Emprendimiento',
      image: '💡',
      attendees: 220
    }
  ];

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      this.nextSlide();
    }, 5000);
  }

  stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.events.length;
  }

  prevSlide() {
    this.currentIndex = this.currentIndex === 0 ? this.events.length - 1 : this.currentIndex - 1;
  }

  goToSlide(index: number) {
    this.currentIndex = index;
    this.stopAutoSlide();
    this.startAutoSlide();
  }

  getVisibleEvents() {
    const events = [];
    for (let i = 0; i < 3; i++) {
      const index = (this.currentIndex + i) % this.events.length;
      events.push(this.events[index]);
    }
    return events;
  }
}