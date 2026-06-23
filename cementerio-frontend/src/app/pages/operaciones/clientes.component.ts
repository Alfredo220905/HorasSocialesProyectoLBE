import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface Cliente {
  id?: number;
  dui: string;
  nombre: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  documentosJson?: string;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Directorio de Propietarios</h2>
    </div>

    <div class="main-grid" [ngClass]="{'has-selection': propietarioSeleccionado}">
      <div class="card">
        <div class="search-bar">
          <div class="search-input-wrapper">
            <svg class="search-icon-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Buscar propietario por nombre o DUI..." [(ngModel)]="filtro">
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>DUI</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cliente of clientesFiltrados" 
                [class.selected]="propietarioSeleccionado?.id === cliente.id"
                (click)="seleccionar(cliente)">
              <td><strong>{{ cliente.dui }}</strong></td>
              <td>{{ cliente.nombre }}</td>
              <td>{{ cliente.telefono || '-' }}</td>
              <td><button class="btn-icon">Ver</button></td>
            </tr>
            <tr *ngIf="clientesFiltrados.length === 0">
              <td colspan="4" class="empty">No hay propietarios registrados.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Panel Lateral de Detalles -->
      <div class="card detail-panel animate-fade-in" *ngIf="propietarioSeleccionado">
        <div class="panel-header">
          <div class="header-info">
            <h3>{{ propietarioSeleccionado.nombre }}</h3>
            <span class="badge">DUI: {{ propietarioSeleccionado.dui }}</span>
            <div class="admin-actions" *ngIf="isAdmin" style="margin-top: 0.8rem; display: flex; gap: 0.5rem;">
               <button class="btn-action edit" (click)="abrirModalEditar(propietarioSeleccionado)">Editar</button>
               <button class="btn-action delete" (click)="eliminarCliente(propietarioSeleccionado)">Eliminar</button>
            </div>
          </div>
          <button class="close-btn" (click)="cerrarSeleccion()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div class="info-group">
          <div>
            <p><strong>Teléfono:</strong> {{ propietarioSeleccionado.telefono || 'No registrado' }}</p>
            <p><strong>Correo:</strong> {{ propietarioSeleccionado.correo || 'No registrado' }}</p>
            <p><strong>Dirección:</strong> {{ propietarioSeleccionado.direccion || 'No registrada' }}</p>
          </div>
          
          <div *ngIf="parseDocumentos(propietarioSeleccionado.documentosJson).length > 0">
            <strong>Documentos:</strong>
            <ul style="margin-top: 0.5rem; padding-left: 1.2rem; color: #475569; font-size: 0.9rem;">
              <li *ngFor="let doc of parseDocumentos(propietarioSeleccionado.documentosJson)">
                {{ doc.nombre || doc.tipo || 'Documento adjunto' }}
              </li>
            </ul>
          </div>
        </div>

        <h4 style="margin-top: 2rem; color: #8a1f53; border-bottom: 2px solid #fce4f0; padding-bottom: 0.5rem;">
          Difuntos / Beneficiarios ({{ difuntos.length }}/4)
        </h4>
        
        <div *ngIf="cargandoDifuntos" class="text-muted" style="margin-top: 1rem;">Cargando información...</div>
        
        <div *ngIf="!cargandoDifuntos && difuntos.length === 0" class="empty-state">
          Este propietario no tiene difuntos asociados en ninguna cripta.
        </div>

        <div class="difuntos-list" *ngIf="!cargandoDifuntos && difuntos.length > 0">
          <div class="difunto-card" *ngFor="let d of difuntos">
            <div class="difunto-header">
              <h5>{{ d.nombre }} <span class="badge" *ngIf="d.correlativo" style="font-size: 0.7rem; padding: 0.1rem 0.5rem;">#{{d.correlativo}}</span></h5>
              <span class="status-badge">{{ d.ubicacion }}</span>
            </div>
            
            <div class="difunto-body">
              <div class="data-row"><span>DUI:</span> <strong>{{ d.dui || 'N/A' }}</strong></div>
              <div class="data-row"><span>Edad / Sexo:</span> <strong>{{ d.edad ? d.edad + ' años' : 'N/A' }} ({{ d.sexo || 'N/A' }})</strong></div>
              <div class="data-row"><span>Estado Civil:</span> <strong>{{ d.estadoCivil || 'N/A' }}</strong></div>
              <div class="data-row"><span>Fechas Vida:</span> <strong>{{ d.fechaNacimiento || '?' }} al {{ d.fechaFallecimiento || '?' }} ({{ d.horaFallecimiento || 'N/A' }})</strong></div>
              <div class="data-row"><span>Entierro:</span> <strong>{{ d.fechaEntierro || '?' }} ({{ d.horaEntierro || 'N/A' }})</strong></div>
              <div class="data-row"><span>Causa:</span> <strong>{{ d.causaMuerte || 'No registrada' }}</strong></div>
              <div class="data-row"><span>Domicilio (Fallecido):</span> <strong>{{ d.domicilioFallecido || 'No registrado' }}</strong></div>
              <div class="data-row" style="margin-top: 0.5rem;"><span>Responsable:</span> <strong>{{ d.nombreResponsable || 'No registrado' }} ({{ d.celularResponsable || '-' }})</strong></div>
              <div class="data-row"><span>Domicilio (Resp.):</span> <strong>{{ d.domicilioResponsable || 'No registrado' }}</strong></div>
              
              <div class="data-row" style="margin-top: 0.5rem;" *ngIf="d.materialPlaca">
                <span>Placa ({{ d.medidasPlaca }}):</span> <strong>{{ d.materialPlaca }}</strong>
              </div>
              <div class="data-row" *ngIf="d.cruzNombreYFecha">
                <span>Cruz General:</span> <strong>Confirmado</strong>
              </div>
              
              <div style="margin-top: 0.5rem; border-top: 1px dashed #e2e8f0; padding-top: 0.5rem;" *ngIf="d.documentos && d.documentos.length > 0">
                <span style="color: #64748b; font-size: 0.85rem; font-weight: bold;">Documentos Adjuntos:</span>
                <ul style="margin: 0.3rem 0 0 1.2rem; font-size: 0.85rem; color: #475569;">
                  <li *ngFor="let doc of d.documentos">{{ doc.nombre || doc.tipo || 'Documento adjunto' }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    <div class="modal-overlay" *ngIf="modalEditarVisible">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Editar Propietario</h3>
        </div>
        <div class="modal-body form-grid">
          <div class="form-group">
            <label>Nombre Completo</label>
            <input type="text" [(ngModel)]="clienteEdicion.nombre" required>
          </div>
          <div class="form-group">
            <label>DUI</label>
            <input type="text" [(ngModel)]="clienteEdicion.dui" (input)="formatearDUI($event)" maxlength="10" required>
          </div>
          <div class="form-group">
            <label>Teléfono</label>
            <input type="text" [(ngModel)]="clienteEdicion.telefono">
          </div>
          <div class="form-group">
            <label>Correo Electrónico</label>
            <input type="email" [(ngModel)]="clienteEdicion.correo">
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Dirección</label>
            <textarea [(ngModel)]="clienteEdicion.direccion" rows="2" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid #cbd5e1;"></textarea>
          </div>
        </div>
        <div class="modal-footer" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
          <button class="btn-cancel" (click)="cerrarModalEditar()">Cancelar</button>
          <button class="btn-save" (click)="guardarEdicion()">Guardar Cambios</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }

    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; font-size: 1.8rem; color: #1e293b; }
    .card { background: #fff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(214,51,132,0.06); margin-bottom: 1rem; border: 1px solid #f1f5f9; }
    
    .main-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; transition: all 0.3s ease; }
    .main-grid.has-selection { grid-template-columns: 1fr 1fr; }

    .search-bar { margin-bottom: 1.2rem; }
    .search-input-wrapper { position: relative; display: flex; align-items: center; }
    .search-icon-svg { position: absolute; left: 1rem; color: #94a3b8; }
    input { width: 100%; padding: 1rem 1.2rem 1rem 3rem; border: 2px solid #fce4f0; border-radius: 12px; font-size: 1.05rem; transition: 0.2s; }
    input:focus { outline: none; border-color: #d63384; box-shadow: 0 0 0 4px rgba(214,51,132,0.1); }
    
    .data-table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 1rem; border-bottom: 1px solid #f8fafc; }
    th { color: #64748b; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; background: #f8fafc; }
    tbody tr { cursor: pointer; transition: 0.2s; }
    tbody tr:hover { background: #fdf2f8; }
    tbody tr.selected { background: #fce4f0; }
    
    .btn-icon { background: #fff; color: #d63384; border: 1px solid #fce4f0; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.8rem; }
    tbody tr:hover .btn-icon { background: #d63384; color: white; }
    
    .badge { background: #fdf2f8; color: #d63384; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 700; font-size: 0.85rem; display: inline-block; }
    .text-muted { color: #64748b; }
    
    .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;}
    .panel-header h3 { margin: 0; color: #8a1f53; font-size: 1.6rem; }
    .close-btn { background: none; border: none; font-size: 1.8rem; color: #94a3b8; cursor: pointer; padding: 0; line-height: 1; }
    .close-btn:hover { color: #b02a37; }
    
    .info-group p { margin: 0.5rem 0; color: #475569; }
    .info-group strong { color: #1e293b; width: 80px; display: inline-block;}
    .info-group { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
    
    .difuntos-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
    .difunto-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; background: #f8fafc; transition: 0.2s; border-left: 4px solid #d63384; }
    .difunto-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); transform: translateY(-2px); }
    .difunto-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
    .difunto-header h5 { margin: 0; font-size: 1.1rem; color: #1e293b; display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
    .status-badge { font-size: 0.7rem; background: #e0f2fe; color: #0369a1; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; }
    
    .difunto-body { display: flex; flex-direction: column; gap: 0.3rem; }
    .data-row { display: flex; justify-content: space-between; font-size: 0.85rem; border-bottom: 1px dashed #e2e8f0; padding-bottom: 0.2rem; }
    .data-row span { color: #64748b; }
    .data-row strong { color: #334155; text-align: right; }
    
    .empty-state { padding: 2rem; text-align: center; color: #94a3b8; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; margin-top: 1rem; }
    .empty { text-align: center; color: #94a3b8; padding: 3rem !important; }

    /* Modales */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
    .modal-content { background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    .modal-header h3 { margin: 0 0 1.5rem 0; color: #8a1f53; font-size: 1.4rem; border-bottom: 2px solid #fce4f0; padding-bottom: 0.5rem;}
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 0.4rem; }
    .form-group input { padding: 0.8rem; font-size: 0.95rem; border: 1px solid #cbd5e1; border-radius: 8px; }
    .btn-cancel { background: #f1f5f9; color: #475569; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: bold; cursor: pointer; }
    .btn-save { background: #d63384; color: white; border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: bold; cursor: pointer; }
    .btn-save:hover { background: #b02a37; }

    .btn-action.edit { background: #e0f2fe; color: #0369a1; border-color: #bae6fd; }
    .btn-action.delete { background: #fee2e2; color: #ef4444; border-color: #fecaca; }

    /* RESPONSIVE MÓVIL */
    @media (max-width: 1000px) { 
      .main-grid.has-selection { grid-template-columns: 1fr; } 
    }
    @media (max-width: 768px) {
      .page-header h2 { font-size: 1.5rem; }
      .card { padding: 1rem; }
      .panel-header { flex-direction: column; align-items: flex-start; gap: 1rem; position: relative; }
      .close-btn { position: absolute; right: 0; top: 0; }
      .info-group { grid-template-columns: 1fr !important; }
      .data-row { flex-direction: column; border-bottom: none; gap: 0.2rem; margin-bottom: 0.5rem; background: #f1f5f9; padding: 0.5rem; border-radius: 6px; }
      .data-row strong { text-align: left; }
      .form-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ClientesComponent implements OnInit {
  private clientesUrl = `${environment.apiUrl}/clientes`;
  private difuntosUrl = `${environment.apiUrl}/difuntos/cliente`;
  
  filtro = '';
  clientes: Cliente[] = [];
  
  propietarioSeleccionado: Cliente | null = null;
  difuntos: any[] = [];
  cargandoDifuntos = false;
  isAdmin = false;

  modalEditarVisible = false;
  clienteEdicion: Cliente = { dui: '', nombre: '' };

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.cargar();
    const role = this.authService.getUserRole();
    this.isAdmin = role === 'ADMIN' || role === 'ADMINISTRADOR';
  }

  get clientesFiltrados() {
    const term = this.filtro.toLowerCase().trim();
    if (!term) return this.clientes;
    return this.clientes.filter(c =>
      c.nombre.toLowerCase().includes(term) || c.dui.toLowerCase().includes(term)
    );
  }

  cargar() {
    this.http.get<Cliente[]>(this.clientesUrl).subscribe(data => this.clientes = data);
  }

  seleccionar(cliente: Cliente) {
    this.propietarioSeleccionado = cliente;
    this.cargarDifuntos(cliente.id!);
  }
  
  cerrarSeleccion() {
    this.propietarioSeleccionado = null;
    this.difuntos = [];
  }

  cargarDifuntos(clienteId: number) {
    this.cargandoDifuntos = true;
    this.difuntos = [];
    this.http.get<any[]>(`${this.difuntosUrl}/${clienteId}`).subscribe({
      next: (data) => {
        this.difuntos = data;
        this.cargandoDifuntos = false;
      },
      error: () => {
        this.difuntos = [];
        this.cargandoDifuntos = false;
      }
    });
  }

  parseDocumentos(json?: string): any[] {
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch (e) {
      return [];
    }
  }

  // EDICION Y ELIMINACION
  formatearDUI(event: any) {
    let input = event.target.value.replace(/\D/g, '').substring(0, 9);
    if (input.length > 8) {
      input = input.substring(0, 8) + '-' + input.substring(8);
    }
    this.clienteEdicion.dui = input;
    event.target.value = input;
  }

  abrirModalEditar(cliente: Cliente) {
    this.clienteEdicion = { ...cliente };
    this.modalEditarVisible = true;
  }

  cerrarModalEditar() {
    this.modalEditarVisible = false;
  }

  guardarEdicion() {
    if (!this.clienteEdicion.nombre || !this.clienteEdicion.dui) {
      alert('Nombre y DUI son obligatorios.');
      return;
    }
    
    this.http.put(`${this.clientesUrl}/${this.clienteEdicion.id}`, this.clienteEdicion).subscribe({
      next: () => {
        alert('Propietario actualizado correctamente.');
        this.cerrarModalEditar();
        this.cargar();
        if (this.propietarioSeleccionado?.id === this.clienteEdicion.id) {
          this.propietarioSeleccionado = { ...this.clienteEdicion };
        }
      },
      error: (err) => {
        alert('Error al actualizar el propietario: ' + (err.error?.message || err.message));
      }
    });
  }

  eliminarCliente(cliente: Cliente) {
    if (this.difuntos.length > 0) {
      alert('No se puede eliminar este propietario porque tiene difuntos asociados en sus propiedades. Elimine los expedientes primero o realice una transferencia.');
      return;
    }
    
    if (confirm(`¿Está seguro que desea eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`)) {
      this.http.delete(`${this.clientesUrl}/${cliente.id}`).subscribe({
        next: () => {
          alert('Propietario eliminado correctamente.');
          this.cerrarSeleccion();
          this.cargar();
        },
        error: (err) => {
          alert('Error al eliminar el propietario: ' + (err.error?.message || err.message));
        }
      });
    }
  }
}
