// src/app/components/chatbot/chatbot.component.ts

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatbotService } from '../../services/chatbot.service';
import { ChatMessage, PreguntaFrecuente } from '../../models/chat.model';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.scss']
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('mensajesContainer') private mensajesContainer!: ElementRef;
  
  chatAbierto = false;
  mensajes: ChatMessage[] = [];
  nuevoMensaje = '';
  enviando = false;
  preguntasFrecuentes: PreguntaFrecuente[] = [];
  mostrarPreguntasFrecuentes = true;
  
  private destroy$ = new Subject<void>();
  private debeScrollear = false;

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    // Suscribirse al estado del chat
    this.chatbotService.chatAbierto$
      .pipe(takeUntil(this.destroy$))
      .subscribe(abierto => {
        this.chatAbierto = abierto;
        if (abierto) {
          this.debeScrollear = true;
        }
      });

    // Suscribirse a los mensajes
    this.chatbotService.mensajes$
      .pipe(takeUntil(this.destroy$))
      .subscribe(mensajes => {
        this.mensajes = mensajes;
        this.debeScrollear = true;
        
        // Ocultar preguntas frecuentes si hay más de 1 mensaje (el inicial)
        this.mostrarPreguntasFrecuentes = mensajes.length <= 1;
      });

    // Cargar preguntas frecuentes
    this.preguntasFrecuentes = this.chatbotService.obtenerPreguntasFrecuentes();
  }

  ngAfterViewChecked(): void {
    if (this.debeScrollear) {
      this.scrollearAbajo();
      this.debeScrollear = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleChat(): void {
    this.chatbotService.toggleChat();
  }

  cerrarChat(): void {
    this.chatbotService.cerrarChat();
  }

  enviarMensaje(): void {
    const mensaje = this.nuevoMensaje.trim();
    
    if (!mensaje || this.enviando) {
      return;
    }

    this.enviando = true;
    this.nuevoMensaje = '';

    this.chatbotService.enviarMensaje(mensaje)
      .subscribe({
        next: () => {
          this.enviando = false;
        },
        error: (error) => {
          console.error('Error al enviar mensaje:', error);
          this.enviando = false;
        }
      });
  }

  seleccionarPregunta(pregunta: string): void {
    this.chatbotService.seleccionarPreguntaFrecuente(pregunta);
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensaje();
    }
  }

  limpiarChat(): void {
    if (confirm('¿Deseas limpiar toda la conversación?')) {
      this.chatbotService.limpiarChat();
      this.mostrarPreguntasFrecuentes = true;
    }
  }

  private scrollearAbajo(): void {
    try {
      if (this.mensajesContainer) {
        const element = this.mensajesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    } catch (err) {
      console.error('Error al scrollear:', err);
    }
  }

  getHoraFormateada(timestamp: Date): string {
    const fecha = new Date(timestamp);
    return fecha.toLocaleTimeString('es-HN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}