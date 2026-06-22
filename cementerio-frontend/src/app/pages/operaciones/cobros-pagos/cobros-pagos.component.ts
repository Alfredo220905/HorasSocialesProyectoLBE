import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PagoService, PagoDTO } from '../../../services/pago.service';

@Component({
  selector: 'app-cobros-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cobros-pagos.component.html',
  styleUrls: ['./cobros-pagos.component.css']
})
export class CobrosPagosComponent implements OnInit {
  pagosPendientes: PagoDTO[] = [];
  pagosTodos: PagoDTO[] = [];
  cargando = true;

  isAdmin = false;
  filtro = 'PENDIENTES'; // 'PENDIENTES' o 'TODOS'

  constructor(
    private pagoService: PagoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const rol = localStorage.getItem('rol');
    this.isAdmin = rol === 'ADMIN' || rol === 'ADMINISTRADOR';
    this.cargarPagos();
  }

  cargarPagos() {
    this.cargando = true;
    if (this.filtro === 'PENDIENTES') {
      this.pagoService.listarPendientes().subscribe({
        next: (res) => {
          this.pagosPendientes = res;
          this.cargando = false;
        },
        error: (err) => {
          console.error(err);
          this.cargando = false;
        }
      });
    } else {
      this.pagoService.listarTodos().subscribe({
        next: (res) => {
          this.pagosTodos = res;
          this.cargando = false;
        },
        error: (err) => {
          console.error(err);
          this.cargando = false;
        }
      });
    }
  }

  cambiarFiltro(nuevoFiltro: string) {
    this.filtro = nuevoFiltro;
    this.cargarPagos();
  }

  marcarPagado(pago: PagoDTO) {
    if (!pago.id) return;
    if (!confirm(`¿Confirmar cobro de $${pago.monto}?`)) return;
    
    this.pagoService.cambiarEstado(pago.id, 'PAGADO').subscribe({
      next: () => {
        alert('Pago registrado correctamente');
        this.cargarPagos();
      },
      error: (err) => {
        console.error(err);
        alert('Ocurrió un error al registrar el pago');
      }
    });
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }
}
