// src/app/pages/dashboard-alumno/dashboard-alumno.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventosService } from '../../services/eventos.service';
import { InscripcionesService } from '../../services/inscripciones.service';
import { ForosService } from '../../services/foros.service';
import { User } from '../../models/user.model';
import { Evento } from '../../models/evento.model';
import { Inscripcion } from '../../models/inscripcion.model';
import { Foro, MensajeForo } from '../../models/foro.model';

@Component({
  selector: 'app-dashboard-alumno',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-alumno.html',
  styleUrls: ['./dashboard-alumno.scss']
})
export class DashboardAlumnoComponent implements OnInit {
  private authService = inject(AuthService);
  private eventosService = inject(EventosService);
  private inscripcionesService = inject(InscripcionesService);
  private forosService = inject(ForosService);
  private router = inject(Router);

  // Usuario actual
  currentUser: User | null = null;

  // Eventos
  eventosDisponibles: Evento[] = [];
  eventosFiltrados: Evento[] = [];
  eventosInscritosIds: Set<string> = new Set();
  searchTerm = '';
  filtroTipo = '';
  filtroCampus = '';

  // Inscripciones
  misInscripciones: Inscripcion[] = [];
  eventosInscritos: Evento[] = [];
  eventosCompletados: Evento[] = [];

  // Foro
  foroActivo: Foro | null = null;
  mensajesForo: MensajeForo[] = [];
  nuevoMensaje = '';
  eventoForoSeleccionado: Evento | null = null;

  // UI States
  vistaActiva: 'eventos' | 'inscripciones' | 'foros' | 'historial' = 'eventos';
  loading = false;
  loadingEventos = false;
  loadingInscripciones = false;
  eventoSeleccionado: Evento | null = null;
  eventoDetalleAbierto: Evento | null = null;
  modalInscripcionAbierto = false;
  modalDetalleAbierto = false;
  modalForoAbierto = false;
  inscribiendo = false;
  cancelandoInscripcion = false;
  enviandoMensaje = false;

  // Estadísticas
  stats = {
    horasTotales: 0,
    eventosInscritos: 0,
    eventosCompletados: 0,
    horasPendientes: 0
  };

  ngOnInit() {
    this.loading = true;
    
    this.authService.currentUser$.subscribe(async user => {
      if (user) {
        this.currentUser = user;
        await this.cargarDatosIniciales();
      }
      this.loading = false;
    });
  }

  async cargarDatosIniciales() {
    try {
      await Promise.all([
        this.cargarEventosDisponibles(),
        this.cargarMisInscripciones()
      ]);
      this.calcularEstadisticas();
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  // ==================== EVENTOS DISPONIBLES ====================
  
  async cargarEventosDisponibles() {
    this.loadingEventos = true;
    
    this.eventosService.getEventosPublicados(this.currentUser?.campus).subscribe({
      next: (eventos) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        this.eventosDisponibles = eventos
          .filter(evento => 
            evento.estado === 'publicado' && 
            new Date(evento.fecha) >= hoy
          )
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
        
        this.eventosFiltrados = this.eventosDisponibles;
        this.loadingEventos = false;
      },
      error: (error) => {
        console.error('Error cargando eventos:', error);
        this.loadingEventos = false;
      }
    });
  }

  filtrarEventos() {
    this.eventosFiltrados = this.eventosDisponibles.filter(evento => {
      const matchSearch = evento.titulo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                         evento.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchTipo = !this.filtroTipo || evento.tipo === this.filtroTipo;
      const matchCampus = !this.filtroCampus || evento.campus === this.filtroCampus;
      
      return matchSearch && matchTipo && matchCampus;
    });
  }

  // ==================== INSCRIPCIONES ====================
  
  async cargarMisInscripciones() {
    if (!this.currentUser) return;

    this.loadingInscripciones = true;

    this.inscripcionesService.getInscripcionesByEstudiante(this.currentUser.uid).subscribe({
      next: async (inscripciones) => {
        this.misInscripciones = inscripciones;
        this.eventosInscritosIds = new Set(inscripciones.map(i => i.eventoId));
        console.log('📋 Eventos inscritos (IDs):', Array.from(this.eventosInscritosIds));
        
        const eventosPromises = inscripciones.map(insc => 
          this.eventosService.getEventoById(insc.eventoId).toPromise()
        );
        
        const eventos = await Promise.all(eventosPromises);
        const eventosValidos = eventos.filter(e => e !== null) as Evento[];
        
        this.eventosInscritos = eventosValidos.filter(e => 
          new Date(e.fecha) >= new Date() && e.estado !== 'finalizado'
        );
        
        this.eventosCompletados = eventosValidos.filter(e => 
          e.estado === 'finalizado' || new Date(e.fecha) < new Date()
        );
        
        this.loadingInscripciones = false;
      },
      error: (error) => {
        console.error('Error cargando inscripciones:', error);
        this.loadingInscripciones = false;
      }
    });
  }

  async abrirModalInscripcion(evento: Evento) {
    console.log('🎯 Intentando abrir modal de inscripción para:', evento.titulo);
    
    if (!this.currentUser) {
      alert('Debes iniciar sesión para inscribirte');
      return;
    }

    try {
      const yaInscrito = await this.inscripcionesService.estaInscrito(
        this.currentUser.uid,
        evento.eventoId!
      );

      if (yaInscrito) {
        alert('Ya estás inscrito en este evento');
        return;
      }

      const inscritosCount = evento.inscritosCount ?? 0;
      const cupo = evento.cupo ?? 0;

      if (cupo > 0 && inscritosCount >= cupo) {
        alert('Este evento ya no tiene cupo disponible');
        return;
      }

      this.eventoSeleccionado = evento;
      this.modalInscripcionAbierto = true;
    } catch (error) {
      console.error('❌ Error al verificar inscripción:', error);
      alert('Error al verificar el estado de inscripción');
    }
  }

  async confirmarInscripcion() {
    if (!this.eventoSeleccionado || !this.currentUser) {
      alert('Error: Datos incompletos');
      return;
    }

    this.inscribiendo = true;

    try {
      await this.inscripcionesService.inscribirEstudiante(this.eventoSeleccionado.eventoId!);
      
      alert('¡Inscripción exitosa!');
      this.cerrarModalInscripcion();
      
      await this.cargarEventosDisponibles();
      await this.cargarMisInscripciones();
      this.calcularEstadisticas();
      
    } catch (error: any) {
      console.error('❌ Error al inscribirse:', error);
      alert(error.message || 'Error al inscribirse en el evento');
    } finally {
      this.inscribiendo = false;
    }
  }

  cerrarModalInscripcion() {
    this.modalInscripcionAbierto = false;
    this.eventoSeleccionado = null;
  }

  async cancelarInscripcion(eventoId: string) {
    if (!confirm('¿Estás seguro de cancelar tu inscripción a este evento?')) {
      return;
    }

    this.cancelandoInscripcion = true;

    try {
      const inscripcion = this.misInscripciones.find(i => i.eventoId === eventoId);
      
      if (!inscripcion || !inscripcion.inscripcionId) {
        throw new Error('No se encontró la inscripción');
      }

      await this.inscripcionesService.cancelarInscripcion(inscripcion.inscripcionId);
      
      alert('Inscripción cancelada exitosamente');
      
      await this.cargarEventosDisponibles();
      await this.cargarMisInscripciones();
      this.calcularEstadisticas();
      
    } catch (error: any) {
      console.error('❌ Error al cancelar inscripción:', error);
      alert(error.message || 'Error al cancelar la inscripción');
    } finally {
      this.cancelandoInscripcion = false;
    }
  }

  // ==================== FOROS ====================
  
  async abrirForo(evento: Evento) {
    console.log('💬 Abriendo foro para:', evento.titulo);
    
    this.eventoForoSeleccionado = evento;
    this.modalForoAbierto = true;
    this.mensajesForo = []; // Limpiar mensajes anteriores
    
    try {
      // Cargar foro del evento
      console.log('🔍 Buscando foro para evento:', evento.eventoId);
      this.foroActivo = await this.forosService.getForoByEvento(evento.eventoId!);
      
      if (!this.foroActivo) {
        console.warn('⚠️ No se encontró el foro para este evento');
        alert('Este evento aún no tiene un foro creado');
        this.cerrarModalForo();
        return;
      }

      console.log('✅ Foro encontrado:', this.foroActivo.foroId);
      
      // Cargar mensajes del foro
      this.forosService.getMensajesByForo(this.foroActivo.foroId!).subscribe({
        next: (mensajes) => {
          console.log('✅ Mensajes cargados:', mensajes.length);
          this.mensajesForo = mensajes;
        },
        error: (error) => {
          console.error('❌ Error cargando mensajes:', error);
          alert('Error al cargar los mensajes del foro');
        }
      });
    } catch (error) {
      console.error('❌ Error cargando foro:', error);
      alert('No se pudo cargar el foro de este evento');
      this.cerrarModalForo();
    }
  }

  cerrarModalForo() {
    console.log('🔴 Cerrando modal del foro');
    this.modalForoAbierto = false;
    this.eventoForoSeleccionado = null;
    this.foroActivo = null;
    this.mensajesForo = [];
    this.nuevoMensaje = '';
  }

  async enviarMensajeForo() {
    if (!this.nuevoMensaje.trim()) {
      alert('Escribe un mensaje');
      return;
    }

    if (!this.foroActivo) {
      alert('No hay un foro activo');
      return;
    }

    if (this.foroActivo.cerrado) {
      alert('Este foro está cerrado');
      return;
    }

    this.enviandoMensaje = true;
    console.log('📤 Enviando mensaje al foro:', this.foroActivo.foroId);

    try {
      await this.forosService.agregarMensaje(this.foroActivo.foroId!, {
        contenido: this.nuevoMensaje.trim()
      });

      console.log('✅ Mensaje enviado correctamente');
      this.nuevoMensaje = '';
      
    } catch (error: any) {
      console.error('❌ Error enviando mensaje:', error);
      alert(error.message || 'Error al enviar el mensaje');
    } finally {
      this.enviandoMensaje = false;
    }
  }

  // ==================== UTILIDADES ====================
  
  estaInscritoEnEvento(eventoId: string): boolean {
    return this.eventosInscritosIds.has(eventoId);
  }

  verDetallesEvento(evento: Evento) {
    this.eventoDetalleAbierto = evento;
    this.modalDetalleAbierto = true;
  }

  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.eventoDetalleAbierto = null;
  }
  
  calcularEstadisticas() {
    if (!this.currentUser) return;

    this.stats = {
      horasTotales: this.currentUser.horasVinculacionTotal || 0,
      eventosInscritos: this.eventosInscritos.length,
      eventosCompletados: this.eventosCompletados.length,
      horasPendientes: this.misInscripciones
        .filter(i => !i.asistencia)
        .reduce((sum, i) => sum + (i.horasGanadas || 0), 0)
    };
  }

  getInscripcionByEvento(eventoId: string): Inscripcion | undefined {
    return this.misInscripciones.find(i => i.eventoId === eventoId);
  }

  getTipoLabel(tipo: string): string {
    const labels: any = {
      'feria': 'Feria',
      'voluntariado': 'Voluntariado',
      'conferencia': 'Conferencia',
      'taller': 'Taller',
      'otro': 'Otro'
    };
    return labels[tipo] || tipo;
  }

  getEstadoLabel(estado: string): string {
    const labels: any = {
      'publicado': 'Publicado',
      'en_curso': 'En Curso',
      'finalizado': 'Finalizado'
    };
    return labels[estado] || estado;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-HN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  getInitials(nombre: string): string {
    if (!nombre) return 'U';
    const nombres = nombre.trim().split(' ');
    return nombres.length > 1 
      ? (nombres[0][0] || '') + (nombres[1][0] || '')
      : nombres[0][0] || 'U';
  }

  getRolLabel(rol: string): string {
    const labels: any = {
      'estudiante': 'Estudiante',
      'coordinador': 'Coordinador',
      'admin': 'Admin'
    };
    return labels[rol] || rol;
  }

  cambiarVista(vista: 'eventos' | 'inscripciones' | 'foros' | 'historial') {
    this.vistaActiva = vista;
  }

  estaEventoLleno(evento: Evento): boolean {
    const inscritos = evento.inscritosCount ?? 0;
    const cupo = evento.cupo ?? 0;
    return cupo > 0 && inscritos >= cupo;
  }

  getTextoBotonInscripcion(evento: Evento): string {
    if (this.estaInscritoEnEvento(evento.eventoId!)) {
      return '✅ Ya Inscrito';
    }
    return this.estaEventoLleno(evento) ? '🚫 Cupo Lleno' : '📝 Inscribirse';
  }

  debeDeshabilitarBoton(evento: Evento): boolean {
    return this.estaEventoLleno(evento) || this.estaInscritoEnEvento(evento.eventoId!);
  }

  logout() {
    this.authService.logout();
  }
}