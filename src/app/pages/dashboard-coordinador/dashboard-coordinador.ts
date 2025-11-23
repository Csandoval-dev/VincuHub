// src/app/pages/dashboard-coordinador/dashboard-coordinador.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventosService } from '../../services/eventos.service';
import { InscripcionesService } from '../../services/inscripciones.service';
import { User } from '../../models/user.model';
import { SidebarCoordinadorComponent, SeccionDashboard } from '../../components/sidebar-coordinador/sidebar-coordinador';
import { EventosListComponent } from '../../components/eventos-list/eventos-list';
import { EventoFormComponent } from '../../components/evento-form/evento-form';
import { AsistenciaManagerComponent } from '../../components/asistencia-manager/asistencia-manager';
import { ForoEventoComponent } from '../../components/foro-evento/foro-evento';
import { CertificadosManagerComponent } from '../../components/certificados-manager/certificados-manager';

@Component({
  selector: 'app-dashboard-coordinador',
  standalone: true,
  imports: [
    CommonModule,
    SidebarCoordinadorComponent,
    EventosListComponent,
    EventoFormComponent,
    AsistenciaManagerComponent,
    ForoEventoComponent,
    CertificadosManagerComponent
  ],
  templateUrl: './dashboard-coordinador.html',
  styleUrls: ['./dashboard-coordinador.scss']
})
export class DashboardCoordinadorComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private eventosService = inject(EventosService);
  private inscripcionesService = inject(InscripcionesService);

  currentUser: User | null = null;
  seccionActiva: SeccionDashboard = 'dashboard';
  
  // Estadísticas
  estadisticas = {
    totalEventos: 0,
    eventosActivos: 0,
    totalInscritos: 0,
    horasCertificadas: 0
  };
  
  loading = true;

  ngOnInit() {
    this.authService.currentUser$.subscribe(async user => {
      this.currentUser = user;
      if (user) {
        await this.cargarEstadisticas();
      }
    });
  }

  async cargarEstadisticas() {
    if (!this.currentUser) return;
    
    try {
      this.loading = true;
      
      // Cargar estadísticas desde Firebase
      this.estadisticas = await this.eventosService.getEstadisticasCoordinador(
        this.currentUser.uid
      );
      
      // Obtener horas certificadas
      this.estadisticas.horasCertificadas = await this.inscripcionesService
        .getHorasCertificadasByCoordinador(this.currentUser.uid);
      
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      this.loading = false;
    }
  }

  cambiarSeccion(seccion: SeccionDashboard) {
    this.seccionActiva = seccion;
  }

  onEventoCreado(eventoId: string) {
    console.log('Evento creado:', eventoId);
    this.cambiarSeccion('eventos-list');
    this.cargarEstadisticas(); // Recargar stats
  }

  logout() {
    this.authService.logout();
  }
}