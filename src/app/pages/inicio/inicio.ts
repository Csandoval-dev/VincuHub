import { Component } from '@angular/core';
import { HeaderComponent } from '../../components/header/header';
import { HeroSectionComponent } from '../../components/hero-section/hero-section';
import { CarouselComponent } from '../../components/carousel/carousel';
import { FooterComponent } from '../../components/footer/footer';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    HeaderComponent,
    HeroSectionComponent,
    CarouselComponent,
    FooterComponent
  ],
  templateUrl: './inicio.html',
  styleUrls: ['./inicio.scss']
})
export class Inicio {
}