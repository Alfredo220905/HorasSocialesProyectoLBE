import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CementerioService } from '../../services/cementerio.service';

@Component({
  selector: 'app-monitoreo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './monitoreo.html',
  styleUrl: './monitoreo.css'
})
export class Monitoreo implements OnInit {
  cementerios: any[] = [];
  selectedCementerio: any = null; 
  espaciosFlat: any[] = [];
  loading = false;

  constructor(private cementerioService: CementerioService) {}

  ngOnInit(): void {
    this.cementerioService.getCementerios().subscribe({
      next: (data) => this.cementerios = data,
      error: () => console.error('Error cargando cementerios')
    });
  }

  seleccionarCementerio(id: number) {
    this.loading = true;
    this.cementerioService.getDetalleCementerio(id).subscribe({
      next: (data) => {
        this.selectedCementerio = data;
        this.espaciosFlat = this.extraerEspacios(data);
        this.loading = false;
      },
      error: () => {
        alert('Error al cargar la información.');
        this.loading = false;
      }
    });
  }

  volver() {
    this.selectedCementerio = null;
    this.espaciosFlat = [];
  }

  private extraerEspacios(cem: any): any[] {
    const result: any[] = [];
    for (const sec of cem.secciones || []) {
      for (const par of sec.parcelas || []) {
        for (const cr of par.criptas || []) {
          for (const esp of cr.espacios || []) {
            result.push({
              id: esp.id,
              numero: esp.numero,
              estado: esp.estado || 'DISPONIBLE',
              difunto: esp.difunto?.nombre || null,
              esPrivado: esp.difunto?.esPrivado || false,
              fila: cr.fila,
              columna: cr.columna,
              parcela: par.nombre,
              seccion: sec.nombre,
              propietario: cr.cliente?.nombre || 'Sin asignar'
            });
          }
        }
      }
    }
    return result;
  }

  get cantDisponible() { return this.espaciosFlat.filter(e => e.estado === 'DISPONIBLE' || !e.estado).length; }
  get cantOcupado() { return this.espaciosFlat.filter(e => e.estado === 'OCUPADO').length; }
  get cantMantenimiento() { return this.espaciosFlat.filter(e => e.estado === 'EN_MANTENIMIENTO').length; }
}
