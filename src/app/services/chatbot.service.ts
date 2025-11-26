// src/app/services/chatbot.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ChatMessage, ChatGPTRequest, ChatGPTResponse, ChatBotConfig } from '../models/chat.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
  // Importar desde environment
  private readonly OPENAI_API_KEY = environment.firebase.openaiApiKey;

  private mensajesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public mensajes$ = this.mensajesSubject.asObservable();

  private chatAbiertoSubject = new BehaviorSubject<boolean>(false);
  public chatAbierto$ = this.chatAbiertoSubject.asObservable();

  private config: ChatBotConfig = {
    mensajeBienvenida: '¡Hola! 👋 Soy VincuHub Assistant, tu asistente virtual. Estoy aquí para ayudarte con todo lo relacionado a eventos y horas de vinculación en CEUTEC. ¿En qué puedo ayudarte hoy?',
    preguntasFrecuentes: [
      { pregunta: '¿Cómo me inscribo en un evento?', categoria: 'eventos' },
      { pregunta: '¿Cómo funcionan las horas de vinculación?', categoria: 'vinculacion' },
      { pregunta: '¿Dónde veo mis eventos inscritos?', categoria: 'eventos' },
      { pregunta: '¿Cómo cancelo una inscripción?', categoria: 'eventos' },
      { pregunta: '¿Quién puede crear eventos?', categoria: 'general' }
    ],
    sistemaPrompt: `Eres VincuHub Assistant, un asistente virtual amigable y profesional de la plataforma VincuHub de CEUTEC (Centro Universitario Tecnológico).
Tu función es ayudar a estudiantes, coordinadores y administradores con la plataforma de gestión de eventos y horas de vinculación.

INFORMACIÓN CLAVE:
- CEUTEC es una institución educativa con campus en San Pedro Sula, Tegucigalpa y La Ceiba
- La plataforma permite gestionar eventos, actividades y ferias universitarias
- Los estudiantes deben completar 60 horas de vinculación
- Los estudiantes pueden inscribirse en eventos y ver su historial
- Los coordinadores pueden crear y gestionar eventos
- Los administradores tienen control total del sistema

RESPONDE DE MANERA:
- Clara y concisa
- Profesional pero amigable
- En español
- Con pasos numerados cuando sea apropiado
- Sugiriendo secciones específicas de la plataforma cuando sea relevante

Si no sabes algo, admítelo y sugiere contactar al soporte técnico o coordinador.`
  };
  constructor(private http: HttpClient) {
    this.inicializarChat();
  }

  private inicializarChat(): void {
    const mensajeBienvenida: ChatMessage = {
      id: this.generarId(),
      contenido: this.config.mensajeBienvenida,
      esUsuario: false,
      timestamp: new Date()
    };
    this.mensajesSubject.next([mensajeBienvenida]);
  }

  toggleChat(): void {
    this.chatAbiertoSubject.next(!this.chatAbiertoSubject.value);
  }

  cerrarChat(): void {
    this.chatAbiertoSubject.next(false);
  }

  abrirChat(): void {
    this.chatAbiertoSubject.next(true);
  }

  obtenerPreguntasFrecuentes() {
    return this.config.preguntasFrecuentes;
  }

  enviarMensaje(contenido: string): Observable<ChatMessage> {
    // Agregar mensaje del usuario
    const mensajeUsuario: ChatMessage = {
      id: this.generarId(),
      contenido,
      esUsuario: true,
      timestamp: new Date()
    };

    const mensajesActuales = this.mensajesSubject.value;
    this.mensajesSubject.next([...mensajesActuales, mensajeUsuario]);

    // Agregar mensaje temporal "escribiendo..."
    const mensajeTemp: ChatMessage = {
      id: 'temp',
      contenido: 'Escribiendo...',
      esUsuario: false,
      timestamp: new Date(),
      enviando: true
    };
    this.mensajesSubject.next([...this.mensajesSubject.value, mensajeTemp]);

    // Llamar a la API de ChatGPT
    return this.llamarChatGPT(contenido).pipe(
      map(respuesta => {
        // Remover mensaje temporal
        const sinTemp = this.mensajesSubject.value.filter(m => m.id !== 'temp');
        
        const mensajeBot: ChatMessage = {
          id: this.generarId(),
          contenido: respuesta,
          esUsuario: false,
          timestamp: new Date()
        };

        this.mensajesSubject.next([...sinTemp, mensajeBot]);
        return mensajeBot;
      }),
      catchError(error => {
        console.error('Error al obtener respuesta del bot:', error);
        
        // Remover mensaje temporal
        const sinTemp = this.mensajesSubject.value.filter(m => m.id !== 'temp');
        
        const mensajeError: ChatMessage = {
          id: this.generarId(),
          contenido: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
          esUsuario: false,
          timestamp: new Date()
        };

        this.mensajesSubject.next([...sinTemp, mensajeError]);
        return of(mensajeError);
      })
    );
  }

  private llamarChatGPT(mensaje: string): Observable<string> {
    // Construir historial de conversación
    const mensajesHistorial = this.mensajesSubject.value
      .filter(m => !m.enviando && m.id !== 'temp')
      .slice(-10) // Solo últimos 10 mensajes para no exceder tokens
      .map(m => ({
        role: m.esUsuario ? 'user' as const : 'assistant' as const,
        content: m.contenido
      }));

    const request: ChatGPTRequest = {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: this.config.sistemaPrompt },
        ...mensajesHistorial,
        { role: 'user', content: mensaje }
      ],
      temperature: 0.7,
      max_tokens: 500
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.OPENAI_API_KEY}`
    });

    return this.http.post<ChatGPTResponse>(this.OPENAI_API_URL, request, { headers }).pipe(
      map(response => response.choices[0].message.content)
    );
  }

  limpiarChat(): void {
    this.inicializarChat();
  }

  seleccionarPreguntaFrecuente(pregunta: string): void {
    this.enviarMensaje(pregunta).subscribe();
  }

  private generarId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}