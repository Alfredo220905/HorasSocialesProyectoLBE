import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CementerioService } from '../../services/cementerio.service';
import { AuthService } from '../../services/auth.service'; // Importante importar tu servicio

@Component({
  selector: 'app-cementerio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cementerio.component.html',
  styleUrls: ['./cementerio.component.css']
})
export class CementerioComponent implements OnInit {

  nombre = '';
  tienePrivado = false;

  constructor(
    private cementerioService: CementerioService,
    private authService: AuthService
  ) {}

  alertaModal = {
    visible: false,
    tipo: '' as 'error' | 'exito' | 'confirmar',
    titulo: '',
    mensaje: ''
  };

  mostrarModalAlerta(tipo: 'error' | 'exito' | 'confirmar', titulo: string, mensaje: string) {
    this.alertaModal = { visible: true, tipo, titulo, mensaje };
  }

  cerrarAlertaModal() {
    this.alertaModal.visible = false;
  }

  ngOnInit(): void {
    // Verificación rápida: si no hay token, mandarlo al login (opcional pero recomendado)
    if (!this.authService.isLoggedIn()) {
      this.authService.logout();
    }
  }

  // Función que activa el botón
  onLogout(): void {
    this.authService.logout();
  }

  crear() {
    const data = {
      nombre: this.nombre,
      tienePrivado: this.tienePrivado
    };

    this.cementerioService.crearCementerio(data)
      .subscribe({
        next: (res) => {
          console.log('Cementerio creado', res);
          this.mostrarModalAlerta('exito', 'Éxito', 'Cementerio creado correctamente');
          this.nombre = ''; 
          this.tienePrivado = false;
        },
        error: (err) => {
          console.error(err);
          this.mostrarModalAlerta('error', 'Error', 'Error al crear el cementerio');
        }
      });
  }
}