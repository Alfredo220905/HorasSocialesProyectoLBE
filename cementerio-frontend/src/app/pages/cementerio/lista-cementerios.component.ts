import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CementerioService } from '../../services/cementerio.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-lista-cementerios',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="header-section">
        <h2 class="title">Lista de Cementerios</h2>
        <button (click)="cargarCementerios()" class="btn-refresh">
          🔄 ACTUALIZAR
        </button>
      </div>

      <div *ngIf="cementerios.length === 0" class="empty-state card">
        <p>No hay cementerios para mostrar. Presione actualizar o verifique la base de datos.</p>
      </div>

      <div class="grid-container">
        <div *ngFor="let c of cementerios" class="cementerio-card card">
          <h3 class="card-name">{{ c.nombre }}</h3>
          <div class="badge" [class.private]="c.tienePrivado" [class.public]="!c.tienePrivado">
            {{ c.tienePrivado ? 'Sede Privada' : 'Sede Pública' }}
          </div>
          <div class="card-actions" style="display: flex; gap: 0.5rem;">
            <button class="btn-details" (click)="verDetalle(c.id)" style="flex: 1;">VER DETALLES ESTRUCTURA</button>
            <button *ngIf="isAdmin" class="btn-delete-cem" (click)="confirmarEliminar(c)" title="Eliminar Cementerio">🗑️</button>
          </div>
        </div>
      </div>

      <!-- Alerta Genérica Modal -->
      <div class="modal-overlay" *ngIf="alertaModal.visible" style="z-index: 2000;">
        <div class="modal-content modal-sm">
          <div class="modal-header" [ngClass]="alertaModal.tipo">
            <h2>{{ alertaModal.titulo }}</h2>
          </div>
          <div class="modal-body text-center">
            <p>{{ alertaModal.mensaje }}</p>
          </div>
          <div class="modal-actions" style="justify-content: center; display: flex; gap: 1rem; margin-top: 1rem;">
            <button class="btn-cancel" *ngIf="alertaModal.tipo === 'confirmar'" (click)="cerrarAlertaModal()">Cancelar</button>
            <button class="btn-primary" (click)="confirmarAlertaModal()">Aceptar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .header-section { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--primary-color); padding-bottom: 1rem; margin-bottom: 2rem; }
    .title { color: var(--primary-color); margin: 0; font-size: 1.8rem; }
    .btn-refresh { background: var(--primary-color); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s; }
    .btn-refresh:hover { background: var(--primary-hover); transform: scale(1.05); }
    .empty-state { padding: 3rem; text-align: center; color: var(--text-muted); }
    .grid-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .cementerio-card { padding: 1.5rem; border-left: 6px solid var(--primary-color); transition: transform 0.2s, box-shadow 0.2s; }
    .cementerio-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px var(--shadow-color); }
    .card-id { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; font-weight: bold; }
    .card-name { margin: 0 0 1rem 0; color: var(--text-main); font-size: 1.25rem; }
    .badge { display: inline-block; padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; }
    .badge.private { background: rgba(215, 51, 135, 0.1); color: var(--primary-color); }
    .badge.public { background: rgba(100, 116, 139, 0.1); color: var(--text-muted); }
    .card-actions { margin-top: 1.5rem; }
    .btn-details { width: 100%; background: transparent; border: 1px solid var(--primary-color); color: var(--primary-color); padding: 0.75rem; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.2s; }
    .btn-details:hover { background: var(--primary-color); color: white; }
    .btn-delete-cem { background: #fee2e2; border: 1px solid #fca5a5; color: #ef4444; padding: 0.75rem; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.2s; display: flex; align-items: center; justify-content: center;}
    .btn-delete-cem:hover { background: #ef4444; color: white; border-color: #ef4444; }

    /* Modal styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    .modal-header h2 { margin: 0 0 1rem 0; font-size: 1.5rem; color: #111827; }
    .modal-header.error h2 { color: #dc2626; }
    .modal-header.exito h2 { color: #16a34a; }
    .modal-body p { margin: 0; color: #4b5563; line-height: 1.5; }
    .btn-cancel { background: white; border: 1px solid #d1d5db; color: #374151; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: var(--primary-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class ListaCementeriosComponent implements OnInit {
  cementerios: any[] = [];
  isAdmin = false;

  alertaModal = {
    visible: false,
    tipo: '' as 'error' | 'exito' | 'confirmar',
    titulo: '',
    mensaje: '',
    confirmarCallback: null as (() => void) | null
  };

  constructor(
    private cementerioService: CementerioService,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const role = this.authService.getUserRole();
    this.isAdmin = role === 'ADMIN' || role === 'ADMINISTRADOR';
    this.cargarCementerios();
  }

  cargarCementerios() {
    this.cementerioService.getCementerios().subscribe({
      next: (res) => this.cementerios = res,
      error: (err) => console.error('Error cargando cementerios:', err)
    });
  }

  verDetalle(id: number) {
    this.router.navigate(['/dashboard/cementerios', id]);
  }

  // --- Alertas Modal ---
  mostrarModalAlerta(tipo: 'error' | 'exito' | 'confirmar', titulo: string, mensaje: string, callback?: () => void) {
    this.alertaModal = {
      visible: true,
      tipo,
      titulo,
      mensaje,
      confirmarCallback: callback || null
    };
  }

  cerrarAlertaModal() {
    this.alertaModal.visible = false;
  }

  confirmarAlertaModal() {
    if (this.alertaModal.confirmarCallback) {
      this.alertaModal.confirmarCallback();
    }
    this.cerrarAlertaModal();
  }

  confirmarEliminar(cementerio: any) {
    this.mostrarModalAlerta('confirmar', 'Eliminar Cementerio', 
      `¿Está seguro de eliminar el cementerio "${cementerio.nombre}"? Esta acción borrará todas sus secciones, parcelas, criptas y espacios.`, 
      () => {
        this.http.delete(`${environment.apiUrl}/cementerios/${cementerio.id}`).subscribe({
          next: () => {
            this.mostrarModalAlerta('exito', 'Cementerio Eliminado', 'El cementerio ha sido eliminado correctamente.');
            this.cargarCementerios();
          },
          error: () => this.mostrarModalAlerta('error', 'Error', 'No se pudo eliminar el cementerio.')
        });
      }
    );
  }
}
