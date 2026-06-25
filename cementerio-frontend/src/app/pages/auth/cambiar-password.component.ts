import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UsuarioService } from '../../services/usuario.service';

@Component({
  selector: 'app-cambiar-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="change-container">
      <div class="change-card">
        <div class="header">
          <div class="icon-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h2>Actualizar Contraseña</h2>
          <p>Su contraseña actual es temporal. Por seguridad, debe crear una nueva para continuar.</p>
        </div>

        <div class="form">
          <div class="form-group">
            <label>Nueva Contraseña</label>
            <div class="input-wrapper">
              <input [type]="verPass1 ? 'text' : 'password'" [(ngModel)]="pass1" placeholder="Mínimo 6 caracteres">
              <span class="eye" (click)="verPass1 = !verPass1">
                <svg *ngIf="!verPass1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg *ngIf="verPass1" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
              </span>
            </div>
          </div>

          <div class="form-group">
            <label>Confirmar Nueva Contraseña</label>
            <div class="input-wrapper">
              <input [type]="verPass2 ? 'text' : 'password'" [(ngModel)]="pass2" placeholder="Repita la contraseña">
              <span class="eye" (click)="verPass2 = !verPass2">
                <svg *ngIf="!verPass2" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg *ngIf="verPass2" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
              </span>
            </div>
          </div>

          <div class="error-box" *ngIf="error">{{ error }}</div>
          <div class="success-box" *ngIf="exito">¡Contraseña actualizada! Redirigiendo...</div>

          <button class="btn-submit" (click)="cambiar()" [disabled]="cargando">
            {{ cargando ? 'ACTUALIZANDO...' : 'GUARDAR Y CONTINUAR' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./cambiar-password.component.css']
})
export class CambiarPasswordComponent implements OnInit {
  pass1 = '';
  pass2 = '';
  error = '';
  exito = false;
  cargando = false;
  verPass1 = false;
  verPass2 = false;

  idUsuario: number | null = null;

  constructor(
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit() {
    this.idUsuario = this.authService.getUserId();
    if (!this.idUsuario) {
      this.router.navigate(['/login']);
    }
  }

  cambiar() {
    this.error = '';
    if (this.pass1.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    if (this.pass1 !== this.pass2) {
      this.error = 'Las contraseñas no coinciden';
      return;
    }

    this.cargando = true;
    // Llamamos al servicio para actualizar la contraseña y poner esTemporal en false
    this.usuarioService.actualizarPassword(this.idUsuario!, this.pass1, false).subscribe({
      next: () => {
        this.exito = true;
        setTimeout(() => {
          this.authService.logout(); // Limpiamos sesión
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.cargando = false;
        this.error = 'Error al actualizar la contraseña. Intente más tarde.';
      }
    });
  }
}
