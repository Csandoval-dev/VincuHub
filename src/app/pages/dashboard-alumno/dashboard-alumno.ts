// src/app/pages/dashboard-alumno/dashboard-alumno.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard-alumno',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-alumno.html',
  styleUrls: ['./dashboard-alumno.scss']
})
export class DashboardAlumnoComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser: User | null = null;

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout() {
    this.authService.logout();
  }
}