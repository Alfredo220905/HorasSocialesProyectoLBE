import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  sidebarClosed = false;
  darkMode = false;
  userRole: string | null = '';
  userEmail: string | null = 'Usuario';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const rawRole = this.authService.getUserRole();
    this.userRole = rawRole ? rawRole.toUpperCase() : '';
    this.userEmail = sessionStorage.getItem('user_email') || 'Usuario';
    
    // Cargar preferencia de modo oscuro
    this.darkMode = localStorage.getItem('dark_mode') === 'true';

    // Ocultar menú en móviles por defecto
    if (window.innerWidth <= 992) {
      this.sidebarClosed = true;
    }
  }

  toggleSidebar(): void {
    this.sidebarClosed = !this.sidebarClosed;
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth <= 992) {
      this.sidebarClosed = true;
    }
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    localStorage.setItem('dark_mode', this.darkMode.toString());
  }

  onLogout(): void {
    this.authService.logout();
  }
}
