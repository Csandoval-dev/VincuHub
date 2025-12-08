// src/app/services/chatbot.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, delay } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ChatMessage, PreguntaFrecuente, ChatBotConfig } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
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
    sistemaPrompt: ''
  };

  // ⚡ RESPUESTAS SIMULADAS (Base de conocimiento temporal)
  private respuestasSimuladas: { [key: string]: string } = {
    'inscribo': 'Para inscribirte en un evento:\n\n1️⃣ Ve a la sección "Eventos" en el menú principal\n2️⃣ Busca el evento que te interesa\n3️⃣ Haz clic en "Ver Detalles"\n4️⃣ Presiona el botón "Inscribirse"\n5️⃣ Confirma tu inscripción\n\n✅ Recibirás una confirmación por correo electrónico.',
    
    'vinculación': 'Las horas de vinculación funcionan así:\n\n📌 Necesitas completar 60 horas totales\n📌 Cada evento tiene horas asignadas\n📌 Al participar en eventos, acumulas horas\n📌 Puedes ver tu progreso en "Mi Perfil"\n📌 Las horas se validan después de cada evento\n\n¿Necesitas más información sobre algún punto específico?',
    
    'eventos inscritos': 'Para ver tus eventos inscritos:\n\n1️⃣ Ve a "Mi Perfil" en el menú\n2️⃣ Haz clic en la pestaña "Mis Eventos"\n3️⃣ Verás dos secciones:\n   • Eventos Próximos\n   • Historial de Eventos\n\nAllí puedes ver todos los detalles de tus inscripciones.',
    
    'cancelo': 'Para cancelar una inscripción:\n\n1️⃣ Ve a "Mi Perfil" > "Mis Eventos"\n2️⃣ Busca el evento que quieres cancelar\n3️⃣ Haz clic en "Ver Detalles"\n4️⃣ Presiona "Cancelar Inscripción"\n\n⚠️ Importante: Solo puedes cancelar con al menos 24 horas de anticipación al evento.',
    
    'crear eventos': 'Pueden crear eventos:\n\n👤 Coordinadores: Pueden crear y gestionar eventos de su área\n👤 Administradores: Tienen acceso completo al sistema\n\n🚫 Los estudiantes NO pueden crear eventos, solo inscribirse.\n\n¿Eres coordinador y necesitas ayuda para crear un evento?',
    
    'hola': '¡Hola! 👋 ¿En qué puedo ayudarte hoy? Puedo asistirte con:\n\n• Inscripción en eventos\n• Horas de vinculación\n• Gestión de perfil\n• Creación de eventos (coordinadores)\n• Cualquier duda sobre la plataforma',
    
    'ayuda': 'Claro, aquí está lo que puedo hacer por ti:\n\n📅 Eventos:\n• Cómo inscribirse\n• Ver eventos disponibles\n• Cancelar inscripciones\n\n⏱️ Horas de Vinculación:\n• Consultar progreso\n• Entender el sistema\n\n👤 Perfil:\n• Gestionar información\n• Ver historial\n\n¿Sobre qué tema necesitas ayuda específica?',
    
    'default': 'Entiendo tu pregunta. Basándome en la información de VincuHub:\n\n• Puedes explorar los eventos disponibles en la sección "Eventos"\n• Consulta tu progreso de horas en "Mi Perfil"\n• Si tienes dudas específicas, no dudes en preguntar\n\n¿Hay algo más específico en lo que pueda ayudarte?'
  };

  constructor() {
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

  obtenerPreguntasFrecuentes(): PreguntaFrecuente[] {
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

    // ⚡ Simular respuesta inteligente
    return this.obtenerRespuestaSimulada(contenido).pipe(
      delay(1000 + Math.random() * 1000), // Delay realista de 1-2 segundos
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

  // ⚡ NUEVO: Obtener respuesta simulada basada en palabras clave
  private obtenerRespuestaSimulada(mensaje: string): Observable<string> {
    const mensajeNormalizado = mensaje.toLowerCase().trim();
    
    // Buscar palabra clave en el mensaje
    for (const [clave, respuesta] of Object.entries(this.respuestasSimuladas)) {
      if (mensajeNormalizado.includes(clave)) {
        return of(respuesta);
      }
    }
    
    // Respuesta por defecto
    return of(this.respuestasSimuladas['default']);
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