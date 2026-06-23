import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CementerioService } from '../../services/cementerio.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="resumen-container">
      <div class="header-section">
        <h2>Resumen Global del Sistema</h2>
        <p class="subtitle">Estadísticas y estado actual de todos los cementerios</p>
      </div>

      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Calculando estadísticas en tiempo real...</p>
      </div>

      <ng-container *ngIf="!loading">
        <!-- Tarjetas principales -->
        <div class="stats-grid">
          <div class="stat-card primary">
            <div class="info">
              <h3>Total Cementerios</h3>
              <span class="value">{{ resumen.totalCementerios }}</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="info">
              <h3>Total Parcelas</h3>
              <span class="value">{{ resumen.totalParcelas }}</span>
            </div>
          </div>

          <div class="stat-card success">
            <div class="info">
              <h3>Difuntos Públicos</h3>
              <span class="value">{{ resumen.totalDifuntosPublicos }}</span>
            </div>
          </div>

          <div class="stat-card accent">
            <div class="info">
              <h3>Difuntos Privados</h3>
              <span class="value">{{ resumen.totalDifuntosPrivados }}</span>
            </div>
          </div>
        </div>

        <!-- Estados de espacios -->
        <div class="section-title">
          <h3>Ocupación de Espacios Global</h3>
        </div>
        <div class="occupancy-bar-container">
          <div class="occupancy-bar">
            <div class="occ-fill disponible" [style.width.%]="getPct(resumen.espaciosDisponibles)"></div>
            <div class="occ-fill ocupado" [style.width.%]="getPct(resumen.espaciosOcupados)"></div>
            <div class="occ-fill mantenimiento" [style.width.%]="getPct(resumen.espaciosMantenimiento)"></div>
          </div>
          <div class="legend-row">
            <span class="leg"><span class="dot green"></span> Disponibles: {{ resumen.espaciosDisponibles }}</span>
            <span class="leg"><span class="dot red"></span> Ocupados: {{ resumen.espaciosOcupados }}</span>
            <span class="leg"><span class="dot orange"></span> Mantenimiento: {{ resumen.espaciosMantenimiento }}</span>
          </div>
        </div>

        <!-- Detalle Privado -->
        <div class="section-title">
          <h3>Detalle de Espacios Privados</h3>
        </div>
        <div class="table-card">
          <div *ngIf="resumen.detallesPrivados.length === 0" class="empty-state">
            <p>No hay difuntos registrados en parcelas privadas.</p>
          </div>
          
          <div class="table-responsive">
            <table *ngIf="resumen.detallesPrivados.length > 0">
              <thead>
                <tr>
                  <th>Difunto</th>
                  <th>Ubicación</th>
                  <th>Propietario / Dueño</th>
                  <th>Beneficiarios</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let det of resumen.detallesPrivados">
                  <td><strong>{{ det.difunto }}</strong></td>
                  <td>
                    <span class="badge">{{ det.cementerio }}</span>
                    <span class="badge light">{{ det.parcela }}</span>
                  </td>
                  <td class="owner-cell">{{ det.propietario }}</td>
                  <td>
                    <ul class="ben-list" *ngIf="det.beneficiarios && det.beneficiarios.length > 0">
                      <li *ngFor="let b of det.beneficiarios">{{ b.nombre || b }}</li>
                    </ul>
                    <span class="text-muted" *ngIf="!det.beneficiarios || det.beneficiarios.length === 0">Ninguno</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styleUrls: ['./resumen.component.css']
})
export class ResumenComponent implements OnInit {
  resumen = {
    totalCementerios: 0,
    totalParcelas: 0,
    totalDifuntosPublicos: 0,
    totalDifuntosPrivados: 0,
    espaciosDisponibles: 0,
    espaciosOcupados: 0,
    espaciosMantenimiento: 0,
    detallesPrivados: [] as any[]
  };
  
  loading = true;

  constructor(private cementerioService: CementerioService, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const rol = this.authService.getUserRole()?.toUpperCase();
    if (rol !== 'ADMIN' && rol !== 'ADMINISTRADOR') {
      if (rol === 'INFORMATICA') {
        this.router.navigate(['/dashboard/gestion-usuarios']);
      } else if (rol === 'OPERADOR') {
        this.router.navigate(['/dashboard/difuntos']);
      } else if (rol === 'VISITANTE') {
        this.router.navigate(['/dashboard/buscar-difunto']);
      }
      return;
    }

    this.cementerioService.getCementerios().subscribe({
      next: (cems) => {
        this.resumen.totalCementerios = cems.length;
        if (cems.length === 0) {
          this.loading = false;
          return;
        }

        let pending = cems.length;
        cems.forEach(c => {
          this.cementerioService.getDetalleCementerio(c.id).subscribe({
            next: (detalle) => {
              this.agregarAlResumen(detalle);
              pending--;
              if (pending === 0) {
                this.loading = false;
              }
            },
            error: (err) => {
              console.error('Error al cargar detalle del cementerio:', err);
              pending--;
              if (pending === 0) {
                this.loading = false;
              }
            }
          });
        });
      },
      error: (err) => {
        console.error('Error cargando cementerios:', err);
        this.loading = false;
      }
    });
  }

  private agregarAlResumen(cem: any) {
    if (!cem || !cem.secciones) return;

    cem.secciones.forEach((sec: any) => {
      const esPrivado = sec.nombre && sec.nombre.toUpperCase() === 'PRIVADO';
      
      if (sec.parcelas) {
        this.resumen.totalParcelas += sec.parcelas.length;
        
        sec.parcelas.forEach((par: any) => {
          if (par.criptas) {
            par.criptas.forEach((cr: any) => {
              if (cr.espacios) {
                cr.espacios.forEach((esp: any) => {
                  
                  // Contar estados
                  if (!esp.estado || esp.estado === 'DISPONIBLE') {
                    this.resumen.espaciosDisponibles++;
                  } else if (esp.estado === 'OCUPADO') {
                    this.resumen.espaciosOcupados++;
                    
                    // Contar difuntos
                    if (esPrivado) {
                      this.resumen.totalDifuntosPrivados++;
                    } else {
                      this.resumen.totalDifuntosPublicos++;
                    }

                    // Agregar a la tabla de detalles privados si aplica
                    if (esPrivado && esp.difunto) {
                      this.resumen.detallesPrivados.push({
                        difunto: esp.difunto.nombre,
                        cementerio: cem.nombre,
                        parcela: par.nombre,
                        propietario: cr.cliente ? cr.cliente.nombre : 'Sin asignar',
                        beneficiarios: cr.beneficiarios || []
                      });
                    }

                  } else if (esp.estado === 'EN_MANTENIMIENTO') {
                    this.resumen.espaciosMantenimiento++;
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  getPct(valor: number): number {
    const total = this.resumen.espaciosDisponibles + this.resumen.espaciosOcupados + this.resumen.espaciosMantenimiento;
    if (total === 0) return 0;
    return (valor / total) * 100;
  }
}
