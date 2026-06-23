import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TransferenciaService, TransferenciaDTO } from '../../services/transferencia.service';

@Component({
  selector: 'app-transferencias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transferencias.html',
  styleUrl: './transferencias.css'
})
export class Transferencias implements OnInit {
  historial: TransferenciaDTO[] = [];
  nuevaTransferencia: TransferenciaDTO = {
    vendedorId: undefined,
    compradorId: undefined,
    compradorNombre: '',
    compradorDui: '',
    criptaId: undefined,
    fechaTransferencia: new Date().toISOString().split('T')[0],
    detalles: ''
  };

  loading = false;
  successMsg = '';
  errorMsg = '';
  
  clientes: any[] = [];
  criptasDelVendedor: any[] = [];

  constructor(private transferenciaService: TransferenciaService, private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarHistorial();
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.http.get<any[]>(`${environment.apiUrl}/clientes`).subscribe({
      next: (data) => this.clientes = data,
      error: (err) => console.error('Error al cargar clientes', err)
    });
  }

  onVendedorChange(): void {
    this.nuevaTransferencia.criptaId = undefined;
    if (this.nuevaTransferencia.vendedorId) {
      this.http.get<any[]>(`${environment.apiUrl}/clientes/${this.nuevaTransferencia.vendedorId}/criptas`).subscribe({
        next: (data) => this.criptasDelVendedor = data,
        error: (err) => console.error('Error al cargar criptas', err)
      });
    } else {
      this.criptasDelVendedor = [];
    }
  }

  formatearDUI(event: any): void {
    let input = event.target.value.replace(/\D/g, '').substring(0, 9);
    if (input.length > 8) {
      input = input.substring(0, 8) + '-' + input.substring(8);
    }
    this.nuevaTransferencia.compradorDui = input;
    event.target.value = input;
  }

  cargarHistorial(): void {
    this.transferenciaService.listarTodos().subscribe({
      next: (data) => {
        this.historial = data;
      },
      error: (err) => {
        console.error('Error al cargar historial', err);
      }
    });
  }

  registrar(): void {
    if (!this.nuevaTransferencia.vendedorId || !this.nuevaTransferencia.compradorNombre || !this.nuevaTransferencia.compradorDui || !this.nuevaTransferencia.criptaId) {
      this.errorMsg = 'Debe ingresar el ID del vendedor, el nombre y DUI del comprador y el ID de la cripta.';
      return;
    }
    
    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    this.transferenciaService.realizarTraspaso(this.nuevaTransferencia).subscribe({
      next: (res) => {
        this.successMsg = '¡Transferencia registrada con éxito!';
        this.loading = false;
        this.cargarHistorial();
        this.nuevaTransferencia = {
          vendedorId: undefined,
          compradorNombre: '',
          compradorDui: '',
          criptaId: undefined,
          fechaTransferencia: new Date().toISOString().split('T')[0],
          detalles: ''
        };
      },
      error: (err) => {
        this.errorMsg = 'Ocurrió un error al registrar la transferencia.';
        this.loading = false;
      }
    });
  }
}
