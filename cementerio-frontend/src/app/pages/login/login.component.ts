import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  correo = '';
  contrasena = '';
  errorMessage = '';
  verPassword = false;
  cargando = false;
  rememberMe = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Cargar el correo si se marcó "Recordar usuario" anteriormente
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      this.correo = savedEmail;
      this.rememberMe = true;
    }
  }

  onLogin() {
    if (!this.correo || !this.contrasena) {
      this.errorMessage = 'Por favor complete todos los campos';
      return;
    }

    this.cargando = true;
    this.errorMessage = '';

    // Lógica de Recordar Usuario
    if (this.rememberMe) {
      localStorage.setItem('remembered_email', this.correo);
    } else {
      localStorage.removeItem('remembered_email');
    }

    this.authService.login(this.correo, this.contrasena).subscribe({
      next: (res) => {
        this.cargando = false;
        // Guardamos los datos en el servicio
        this.authService.setSession(res);

        // FLUJO DE CONTRASEÑA TEMPORAL
        if (res.esTemporal) {
          console.log('Usuario detectado como TEMPORAL. Redirigiendo a cambio de clave.');
          this.router.navigate(['/cambiar-password']);
        } else {
          console.log('Usuario normal. Redirigiendo al dashboard.');
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.cargando = false;
        this.errorMessage = 'Credenciales inválidas o error de conexión';
      }
    });
  }
}

