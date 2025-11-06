// src/app/pages/dashboard-coordinador/dashboard-coordinador.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-dashboard-coordinador',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-coordinador.html',
  styleUrls: ['./dashboard-coordinador.scss']
})
export class DashboardCoordinadorComponent implements OnInit {
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