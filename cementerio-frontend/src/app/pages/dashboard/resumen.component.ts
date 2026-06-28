import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CementerioService } from '../../services/cementerio.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <!-- Filtro por cementerio -->
        <div class="filter-section" style="margin-bottom: 2rem; background: var(--card-bg); padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 1rem; justify-content: space-between; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 300px;">
            <div style="font-weight: 600; color: var(--text-main);">Filtrar resumen por cementerio:</div>
            <select [(ngModel)]="cementerioSeleccionado" (ngModelChange)="onCementerioChange()" style="flex: 1; max-width: 400px; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 1rem;">
              <option [ngValue]="null">Todos los cementerios (Global)</option>
              <option *ngFor="let c of cementeriosBase" [ngValue]="c.id">{{ c.nombre }}</option>
            </select>
          </div>
          <button *ngIf="cementerioSeleccionado" class="btn-action view" (click)="verMasCementerio()" style="display: flex; align-items: center; gap: 0.5rem; background: #fff0f6; border: 1px solid #fce4f0; color: #d63384; padding: 0.6rem 1rem; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            Ver Más
          </button>
        </div>
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
          <h3>Ocupación de Espacios</h3>
        </div>
        
        <div class="chart-container" style="display: flex; flex-direction: column; align-items: center; background: var(--card-bg); padding: 2.5rem; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); margin-bottom: 2rem;">
          <div class="pie-chart" [style.background]="getPieChartStyle()" style="width: 260px; height: 260px; border-radius: 50%; box-shadow: 0 8px 16px rgba(0,0,0,0.1); position: relative; margin-bottom: 2.5rem; transition: background 0.5s ease-out;">
            <!-- Inner circle for donut effect -->
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 150px; height: 150px; background: var(--card-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
              <span style="font-size: 2.2rem; font-weight: 800; color: var(--text-main);">{{ getPct(resumen.espaciosOcupados) | number:'1.0-0' }}%</span>
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Ocupación</span>
            </div>
          </div>
          <div class="legend-row" style="display: flex; gap: 3rem; justify-content: center; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 0.8rem; padding: 0.5rem 1rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
              <div style="width: 18px; height: 18px; border-radius: 4px; background: #16a34a;"></div>
              <span style="font-weight: 600; color: #166534; font-size: 1.1rem;">Disponibles: <strong style="font-size: 1.2rem;">{{ resumen.espaciosDisponibles }}</strong></span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.8rem; padding: 0.5rem 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
              <div style="width: 18px; height: 18px; border-radius: 4px; background: #dc2626;"></div>
              <span style="font-weight: 600; color: #991b1b; font-size: 1.1rem;">Ocupados: <strong style="font-size: 1.2rem;">{{ resumen.espaciosOcupados }}</strong></span>
            </div>
          </div>
        </div>

      </ng-container>
    </div>
  `,
  styleUrls: ['./resumen.component.css']
})
export class ResumenComponent implements OnInit {
  cementeriosBase: any[] = [];
  detallesRaw: any[] = [];
  cementerioSeleccionado: number | null = null;

  resumen = {
    totalCementerios: 0,
    totalParcelas: 0,
    totalDifuntosPublicos: 0,
    totalDifuntosPrivados: 0,
    espaciosDisponibles: 0,
    espaciosOcupados: 0
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
        this.cementeriosBase = cems;
        
        if (cems.length === 0) {
          this.loading = false;
          return;
        }

        let pending = cems.length;
        cems.forEach(c => {
          this.cementerioService.getDetalleCementerio(c.id).subscribe({
            next: (detalle) => {
              this.detallesRaw.push(detalle);
              pending--;
              if (pending === 0) {
                this.calcularResumen();
                this.loading = false;
              }
            },
            error: (err) => {
              console.error('Error al cargar detalle del cementerio:', err);
              pending--;
              if (pending === 0) {
                this.calcularResumen();
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
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  calcularResumen() {
    this.resumen = {
      totalCementerios: this.cementerioSeleccionado ? 1 : this.cementeriosBase.length,
      totalParcelas: 0,
      totalDifuntosPublicos: 0,
      totalDifuntosPrivados: 0,
      espaciosDisponibles: 0,
      espaciosOcupados: 0
    };

    this.detallesRaw.forEach(cem => {
      if (this.cementerioSeleccionado && cem.id !== this.cementerioSeleccionado) {
        return;
      }
      this.agregarAlResumen(cem);
    });
  }

  onCementerioChange() {
    this.calcularResumen();
  }

  getPct(valor: number): number {
    const total = this.resumen.espaciosDisponibles + this.resumen.espaciosOcupados;
    if (total === 0) return 0;
    return (valor / total) * 100;
  }

  getPieChartStyle() {
    const ocupadoPct = this.getPct(this.resumen.espaciosOcupados);
    return `conic-gradient(#dc2626 0% ${ocupadoPct}%, #16a34a ${ocupadoPct}% 100%)`;
  }

  verMasCementerio() {
    if (this.cementerioSeleccionado) {
      this.router.navigate(['/dashboard/cementerios', this.cementerioSeleccionado]);
    }
  }
}
