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
  eventosInscritosIds: Set<string> = new Set(); // ✅ NUEVO: IDs de eventos inscritos
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
  eventoDetalleAbierto: Evento | null = null; // ✅ NUEVO: Para modal de detalles
  modalInscripcionAbierto = false;
  modalDetalleAbierto = false; // ✅ NUEVO
  modalForoAbierto = false;
  inscribiendo = false;
  cancelandoInscripcion = false; // ✅ NUEVO
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
        // Filtrar solo eventos futuros y publicados
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0); // Resetear hora para comparar solo fechas
        
        this.eventosDisponibles = eventos
          .filter(evento => 
            evento.estado === 'publicado' && 
            new Date(evento.fecha) >= hoy
          )
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()); // Ordenar por fecha ascendente
        
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
        
        // ✅ NUEVO: Guardar IDs de eventos inscritos
        this.eventosInscritosIds = new Set(inscripciones.map(i => i.eventoId));
        console.log('📋 Eventos inscritos (IDs):', Array.from(this.eventosInscritosIds));
        
        // Cargar detalles de eventos inscritos
        const eventosPromises = inscripciones.map(insc => 
          this.eventosService.getEventoById(insc.eventoId).toPromise()
        );
        
        const eventos = await Promise.all(eventosPromises);
        const eventosValidos = eventos.filter(e => e !== null) as Evento[];
        
        // Separar inscritos y completados
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
    console.log('👤 Usuario actual:', this.currentUser);
    
    if (!this.currentUser) {
      console.error('❌ No hay usuario autenticado');
      alert('Debes iniciar sesión para inscribirte');
      return;
    }

    try {
      // Verificar si ya está inscrito
      console.log('🔍 Verificando si ya está inscrito...');
      const yaInscrito = await this.inscripcionesService.estaInscrito(
        this.currentUser.uid,
        evento.eventoId!
      );
      console.log('✅ Ya inscrito:', yaInscrito);

      if (yaInscrito) {
        alert('Ya estás inscrito en este evento');
        return;
      }

      // Verificar cupo
      const inscritosCount = evento.inscritosCount ?? 0;
      const cupo = evento.cupo ?? 0;
      console.log(`📊 Cupo: ${inscritosCount}/${cupo}`);

      if (cupo > 0 && inscritosCount >= cupo) {
        alert('Este evento ya no tiene cupo disponible');
        return;
      }

      console.log('✅ Abriendo modal de inscripción');
      this.eventoSeleccionado = evento;
      this.modalInscripcionAbierto = true;
    } catch (error) {
      console.error('❌ Error al verificar inscripción:', error);
      alert('Error al verificar el estado de inscripción');
    }
  }

  async confirmarInscripcion() {
    if (!this.eventoSeleccionado || !this.currentUser) {
      console.error('❌ Falta evento o usuario:', {
        evento: this.eventoSeleccionado,
        user: this.currentUser
      });
      alert('Error: Datos incompletos');
      return;
    }

    this.inscribiendo = true;
    console.log('📝 Iniciando inscripción...');
    console.log('- Usuario:', this.currentUser.uid);
    console.log('- Evento:', this.eventoSeleccionado.eventoId);

    try {
      await this.inscripcionesService.inscribirEstudiante(this.eventoSeleccionado.eventoId!);
      
      console.log('✅ Inscripción exitosa');
      alert('¡Inscripción exitosa!');
      this.cerrarModalInscripcion();
      
      // Recargar datos
      console.log('🔄 Recargando datos...');
      await this.cargarEventosDisponibles();
      await this.cargarMisInscripciones();
      this.calcularEstadisticas();
      console.log('✅ Datos recargados');
      
    } catch (error: any) {
      console.error('❌ Error al inscribirse:', error);
      console.error('❌ Stack:', error.stack);
      alert(error.message || 'Error al inscribirse en el evento');
    } finally {
      this.inscribiendo = false;
    }
  }

  cerrarModalInscripcion() {
    this.modalInscripcionAbierto = false;
    this.eventoSeleccionado = null;
  }

  // ==================== FOROS ====================
  
  async abrirForo(evento: Evento) {
    this.eventoForoSeleccionado = evento;
    this.modalForoAbierto = true;
    
    try {
      // Cargar foro del evento
      this.foroActivo = await this.forosService.getForoByEvento(evento.eventoId!);
      
      if (this.foroActivo) {
        // Cargar mensajes
        this.forosService.getMensajesByForo(this.foroActivo.foroId!).subscribe({
          next: (mensajes) => {
            this.mensajesForo = mensajes;
          },
          error: (error) => {
            console.error('Error cargando mensajes:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error cargando foro:', error);
      alert('No se pudo cargar el foro de este evento');
    }
  }

  cerrarModalForo() {
    this.modalForoAbierto = false;
    this.eventoForoSeleccionado = null;
    this.foroActivo = null;
    this.mensajesForo = [];
    this.nuevoMensaje = '';
  }

  async enviarMensajeForo() {
    if (!this.nuevoMensaje.trim() || !this.foroActivo) return;

    this.enviandoMensaje = true;

    try {
      await this.forosService.agregarMensaje(this.foroActivo.foroId!, {
        contenido: this.nuevoMensaje.trim()
      });

      this.nuevoMensaje = '';
      
    } catch (error: any) {
      console.error('Error enviando mensaje:', error);
      alert(error.message || 'Error al enviar el mensaje');
    } finally {
      this.enviandoMensaje = false;
    }
  }

  // ==================== UTILIDADES ====================
  
  // ✅ NUEVO: Verificar si está inscrito en un evento
  estaInscritoEnEvento(eventoId: string): boolean {
    return this.eventosInscritosIds.has(eventoId);
  }

  // ✅ NUEVO: Abrir modal de detalles
  verDetallesEvento(evento: Evento) {
    this.eventoDetalleAbierto = evento;
    this.modalDetalleAbierto = true;
  }

  // ✅ NUEVO: Cerrar modal de detalles
  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.eventoDetalleAbierto = null;
  }

  // ✅ NUEVO: Cancelar inscripción
  async cancelarInscripcion(eventoId: string) {
    if (!confirm('¿Estás seguro de cancelar tu inscripción a este evento?')) {
      return;
    }

    this.cancelandoInscripcion = true;
    console.log('🗑️ Cancelando inscripción del evento:', eventoId);

    try {
      // Buscar la inscripción
      const inscripcion = this.misInscripciones.find(i => i.eventoId === eventoId);
      
      if (!inscripcion || !inscripcion.inscripcionId) {
        throw new Error('No se encontró la inscripción');
      }

      // Eliminar inscripción (necesitarás crear este método en el service)
      await this.inscripcionesService.cancelarInscripcion(inscripcion.inscripcionId);
      
      alert('Inscripción cancelada exitosamente');
      
      // Recargar datos
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
    const nombres = nombre.trim().split(' ');
    return nombres.length > 1 
      ? nombres[0][0] + nombres[1][0]
      : nombres[0][0];
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

  // Verificar si el evento está lleno
  estaEventoLleno(evento: Evento): boolean {
    const inscritos = evento.inscritosCount ?? 0;
    const cupo = evento.cupo ?? 0;
    return cupo > 0 && inscritos >= cupo;
  }

  // Obtener texto del botón de inscripción
  getTextoBotonInscripcion(evento: Evento): string {
    if (this.estaInscritoEnEvento(evento.eventoId!)) {
      return '✅ Ya Inscrito';
    }
    return this.estaEventoLleno(evento) ? '🚫 Cupo Lleno' : '📝 Inscribirse';
  }

  // ✅ NUEVO: Determinar si el botón debe estar deshabilitado
  debeDeshabilitarBoton(evento: Evento): boolean {
    return this.estaEventoLleno(evento) || this.estaInscritoEnEvento(evento.eventoId!);
  }

  logout() {
    this.authService.logout();
  }
}