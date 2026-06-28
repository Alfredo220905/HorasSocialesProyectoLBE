import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let cliente of clientesFiltrados" 
                [class.selected]="propietarioSeleccionado?.id === cliente.id"
                (click)="seleccionar(cliente)">
              <td><strong>{{ cliente.dui }}</strong></td>
              <td>{{ cliente.nombre }}</td>
              <td>{{ cliente.telefono || 'No registrado' }}</td>
              <td>{{ cliente.telefono || 'No registrado' }}</td>
              <td>
                <div class="actions">
                  <button class="btn-action view" title="Ver Detalle" (click)="seleccionar(cliente); $event.stopPropagation()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                  <button class="btn-action edit" title="Editar Propietario" (click)="abrirModalEditar(cliente); $event.stopPropagation()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="btn-action delete" title="Eliminar Propietario" (click)="eliminarCliente(cliente); $event.stopPropagation()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </td>
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
            <div class="admin-actions" style="margin-top: 0.8rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
               <button class="btn-action edit" style="width: auto; padding: 0 1rem;" (click)="abrirModalEditar(propietarioSeleccionado)">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Editar
               </button>
               <button class="btn-action delete" style="width: auto; padding: 0 1rem;" (click)="eliminarCliente(propietarioSeleccionado)">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Eliminar
               </button>
               <button class="btn-action" style="width: auto; padding: 0 1rem; background: #10b981;" (click)="generarPDF(propietarioSeleccionado, difuntos)">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Descargar
               </button>
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
            <ul style="margin-top: 0.5rem; padding-left: 1.2rem; color: var(--text-main); font-size: 0.9rem;">
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
            <div class="difunto-body">
              <div class="data-row"><span>DUI:</span> <strong>{{ d.dui || 'No registrado' }}</strong></div>
              <div class="data-row"><span>Edad / Sexo:</span> <strong>{{ d.edad ? d.edad + ' años' : 'No registrado' }} ({{ d.sexo || 'No registrado' }})</strong></div>
              <div class="data-row"><span>Estado Civil:</span> <strong>{{ d.estadoCivil || 'No registrado' }}</strong></div>
              <div class="data-row"><span>Fechas Vida:</span> <strong>{{ d.fechaNacimiento || '?' }} al {{ d.fechaFallecimiento || '?' }} ({{ d.horaFallecimiento || 'No registrada' }})</strong></div>
              <div class="data-row"><span>Entierro:</span> <strong>{{ d.fechaEntierro || '?' }} ({{ d.horaEntierro || 'No registrada' }})</strong></div>
              <div class="data-row"><span>Causa:</span> <strong>{{ d.causaMuerte || 'No registrada' }}</strong></div>
              <div class="data-row"><span>Domicilio (Fallecido):</span> <strong>{{ d.domicilioFallecido || 'No registrado' }}</strong></div>
              <div class="data-row" style="margin-top: 0.5rem;"><span>Responsable:</span> <strong>{{ d.nombreResponsable || 'No registrado' }} ({{ d.celularResponsable || 'No registrado' }})</strong></div>
              <div class="data-row"><span>Domicilio (Resp.):</span> <strong>{{ d.domicilioResponsable || 'No registrado' }}</strong></div>
              
              <div class="data-row" style="margin-top: 0.5rem;" *ngIf="d.materialPlaca">
                <span>Placa ({{ d.medidasPlaca }}):</span> <strong>{{ d.materialPlaca }}</strong>
              </div>
              <div class="data-row" *ngIf="d.cruzNombreYFecha">
                <span>Cruz General:</span> <strong>Confirmado</strong>
              </div>
              
              <div style="margin-top: 0.5rem; border-top: 1px dashed #e2e8f0; padding-top: 0.5rem;" *ngIf="d.documentos && d.documentos.length > 0">
                <span style="color: var(--text-muted); font-size: 0.85rem; font-weight: bold;">Documentos Adjuntos:</span>
                <ul style="margin: 0.3rem 0 0 1.2rem; font-size: 0.85rem; color: var(--text-main);">
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
            <textarea [(ngModel)]="clienteEdicion.direccion" rows="2" style="width: 100%; padding: 0.8rem; border-radius: 8px; border: 1px solid var(--border-color);"></textarea>
          </div>
          <div style="grid-column: 1 / -1; margin-top: 1rem; border-top: 1px solid var(--border-table); padding-top: 1rem;">
            <h4 style="margin: 0 0 0.5rem 0; color: #8a1f53;">Difuntos Asociados</h4>
            <div *ngIf="cargandoDifuntosEdicion" style="font-size: 0.9rem; color: var(--text-muted);">Cargando...</div>
            <div *ngIf="!cargandoDifuntosEdicion && difuntosEdicion.length === 0" style="font-size: 0.9rem; color: var(--text-muted);">No posee difuntos asociados.</div>
            <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.9rem; color: var(--text-main);" *ngIf="!cargandoDifuntosEdicion && difuntosEdicion.length > 0">
              <li *ngFor="let d of difuntosEdicion" style="margin-bottom: 0.3rem;">
                <strong>{{ d.nombre }}</strong> ({{ d.ubicacion || 'Sin ubicación' }})
              </li>
            </ul>
          </div>
        </div>
        <div class="modal-footer" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
          <button class="btn-cancel" (click)="cerrarModalEditar()">Cancelar</button>
          <button class="btn-action" style="width: auto; padding: 0 1rem; background: #10b981;" (click)="generarPDF(clienteEdicion, difuntosEdicion)">Descargar PDF</button>
          <button class="btn-save" (click)="guardarEdicion()">Guardar Cambios</button>
        </div>
      </div>
    </div>

    <!-- Alerta Genérica Modal -->
    <div class="modal-overlay" *ngIf="alertaModal.visible" style="z-index: 2000;">
      <div class="modal-content" style="max-width: 400px; text-align: center;">
        <div class="modal-header" style="justify-content: center; border-bottom: none; margin-bottom: 0;">
          <h3 [ngStyle]="{'color': alertaModal.tipo === 'error' ? '#ef4444' : '#8a1f53'}">{{ alertaModal.titulo }}</h3>
        </div>
        <div class="modal-body" style="padding: 1rem 0 2rem; color: var(--text-main);">
          <p>{{ alertaModal.mensaje }}</p>
        </div>
        <div class="modal-footer" style="display: flex; gap: 1rem; justify-content: center;">
          <button class="btn-cancel" *ngIf="alertaModal.tipo === 'confirmar'" (click)="cerrarAlertaModal()">Cancelar</button>
          <button class="btn-save" [ngStyle]="{'background': alertaModal.tipo === 'error' ? '#ef4444' : '#d63384'}" (click)="confirmarAlertaModal()">Aceptar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }

    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; font-size: 1.8rem; color: var(--text-main); }
    .card { background: var(--card-bg); padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(214,51,132,0.06); margin-bottom: 1rem; border: 1px solid var(--border-color); }
    
    .main-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; transition: all 0.3s ease; }
    .main-grid.has-selection { grid-template-columns: 1fr 1fr; }

    .search-bar { margin-bottom: 1.2rem; }
    .search-input-wrapper { position: relative; display: flex; align-items: center; }
    .search-icon-svg { position: absolute; left: 1rem; color: var(--text-muted); }
    input { width: 100%; padding: 1rem 1.2rem 1rem 3rem; border: 2px solid var(--border-color); background: var(--input-bg); color: var(--text-main); border-radius: 12px; font-size: 1.05rem; transition: 0.2s; }
    input:focus { outline: none; border-color: #d63384; box-shadow: 0 0 0 4px rgba(214,51,132,0.1); }
    
    .data-table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 1rem; border-bottom: 1px solid var(--border-table); }
    th { color: var(--text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; background: var(--table-header-bg); }
    tr:hover { background: var(--hover-bg); }
    tbody tr { cursor: pointer; transition: 0.2s; }
    tbody tr:hover { background: #fdf2f8; }
    tbody tr.selected { background: #fce4f0; }
    
    .actions { display: flex; gap: 0.5rem; }
    .btn-action {
      border: none;
      background: var(--primary-color);
      color: white;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .btn-action:hover { transform: scale(1.1); filter: brightness(1.1); }
    .btn-action.edit { background: #0ea5e9; }
    .btn-action.delete { background: #ef4444; }
    
    .badge { background: #fdf2f8; color: #d63384; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 700; font-size: 0.85rem; display: inline-block; }
    .text-muted { color: var(--text-muted); }
    
    .panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;}
    .panel-header h3 { margin: 0; color: #8a1f53; font-size: 1.6rem; }
    .close-btn { background: none; border: none; font-size: 1.8rem; color: var(--text-muted); cursor: pointer; padding: 0; line-height: 1; }
    .close-btn:hover { color: #b02a37; }
    
    .info-group p { margin: 0.5rem 0; color: var(--text-main); }
    .info-group strong { color: var(--text-main); width: 80px; display: inline-block;}
    .info-group { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start; }
    
    .difuntos-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
    .difunto-card { border: 1px solid var(--border-table); border-radius: 8px; padding: 1rem; background: var(--table-header-bg); transition: 0.2s; border-left: 4px solid #d63384; }
    .difunto-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); transform: translateY(-2px); }
    .difunto-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
    .difunto-header h5 { margin: 0; font-size: 1.1rem; color: var(--text-main); display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
    .status-badge { font-size: 0.7rem; background: #e0f2fe; color: #0369a1; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; }
    
    .difunto-body { display: flex; flex-direction: column; gap: 0.3rem; }
    .data-row { display: flex; justify-content: space-between; font-size: 0.85rem; border-bottom: 1px dashed #e2e8f0; padding-bottom: 0.2rem; }
    .data-row span { color: var(--text-muted); }
    .data-row strong { color: var(--text-main); text-align: right; }
    
    .empty-state { padding: 2rem; text-align: center; color: var(--text-muted); background: var(--table-header-bg); border-radius: 8px; border: 1px dashed var(--border-table); margin-top: 1rem; }
    .empty { text-align: center; color: var(--text-muted); padding: 3rem !important; }

    /* Modales */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
    .modal-content { background: var(--card-bg); padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    .modal-header h3 { margin: 0 0 1.5rem 0; color: #8a1f53; font-size: 1.4rem; border-bottom: 2px solid #fce4f0; padding-bottom: 0.5rem;}
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.4rem; }
    .form-group input { padding: 0.8rem; font-size: 0.95rem; border: 1px solid var(--border-color); border-radius: 8px; }
    .btn-cancel { background: var(--card-bg); color: var(--text-main); border: none; padding: 0.8rem 1.5rem; border-radius: 8px; font-weight: bold; cursor: pointer; }
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
      .data-row { flex-direction: column; border-bottom: none; gap: 0.2rem; margin-bottom: 0.5rem; background: var(--card-bg); padding: 0.5rem; border-radius: 6px; }
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
  difuntosEdicion: any[] = [];
  cargandoDifuntosEdicion = false;

  alertaModal = {
    visible: false,
    titulo: '',
    mensaje: '',
    tipo: 'info' as 'info' | 'error' | 'confirmar',
    accionConfirmar: () => {}
  };

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
    this.difuntosEdicion = [];
    
    if (this.propietarioSeleccionado?.id === cliente.id) {
      this.difuntosEdicion = [...this.difuntos];
    } else {
      this.cargandoDifuntosEdicion = true;
      this.http.get<any[]>(`${this.difuntosUrl}/${cliente.id}`).subscribe({
        next: (data) => {
          this.difuntosEdicion = data;
          this.cargandoDifuntosEdicion = false;
        },
        error: () => {
          this.cargandoDifuntosEdicion = false;
        }
      });
    }
  }

  cerrarModalEditar() {
    this.modalEditarVisible = false;
  }
  
  generarPDF(cliente: Cliente, difuntos: any[]) {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(138, 31, 83);
    doc.text('Expediente de Propietario', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Nombre Completo: ${cliente.nombre}`, 14, 35);
    doc.text(`DUI: ${cliente.dui}`, 14, 42);
    doc.text(`Teléfono: ${cliente.telefono || 'No registrado'}`, 14, 49);
    doc.text(`Correo Electrónico: ${cliente.correo || 'No registrado'}`, 14, 56);
    doc.text(`Dirección: ${cliente.direccion || 'No registrada'}`, 14, 63);
    
    if (difuntos && difuntos.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(138, 31, 83);
      doc.text('Difuntos Asociados en Propiedades:', 14, 75);
      
      const body = difuntos.map(d => [
        d.nombre,
        d.dui || 'No registrado',
        d.ubicacion || 'No registrada',
        d.fechaFallecimiento || 'No registrada'
      ]);
      
      autoTable(doc, {
        startY: 80,
        head: [['Nombre Completo', 'DUI', 'Ubicación', 'Fallecimiento']],
        body: body,
        headStyles: { fillColor: [214, 51, 132] }
      });
    } else {
      doc.setFontSize(12);
      doc.text('No posee difuntos asociados.', 14, 75);
    }
    
    doc.save(`Expediente_${cliente.dui}.pdf`);
  }

  mostrarAlerta(titulo: string, mensaje: string, tipo: 'info' | 'error' | 'confirmar' = 'info', accionConfirmar?: () => void) {
    this.alertaModal = {
      visible: true,
      titulo,
      mensaje,
      tipo,
      accionConfirmar: accionConfirmar || (() => {})
    };
  }

  cerrarAlertaModal() {
    this.alertaModal.visible = false;
  }

  confirmarAlertaModal() {
    if (this.alertaModal.accionConfirmar) {
      this.alertaModal.accionConfirmar();
    }
    this.cerrarAlertaModal();
  }

  guardarEdicion() {
    if (!this.clienteEdicion.nombre || !this.clienteEdicion.dui) {
      this.mostrarAlerta('Campos Requeridos', 'Nombre y DUI son obligatorios.', 'error');
      return;
    }
    
    this.http.put(`${this.clientesUrl}/${this.clienteEdicion.id}`, this.clienteEdicion).subscribe({
      next: () => {
        this.mostrarAlerta('Éxito', 'Propietario actualizado correctamente.', 'info');
        this.cerrarModalEditar();
        this.cargar();
        if (this.propietarioSeleccionado?.id === this.clienteEdicion.id) {
          this.propietarioSeleccionado = { ...this.clienteEdicion };
        }
      },
      error: (err) => {
        this.mostrarAlerta('Error', 'Error al actualizar el propietario: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  eliminarCliente(cliente: Cliente) {
    if (this.propietarioSeleccionado?.id === cliente.id && this.difuntos.length > 0) {
      this.mostrarAlerta('No permitido', 'No se puede eliminar este propietario porque tiene difuntos asociados en sus propiedades.', 'error');
      return;
    }
    
    this.mostrarAlerta('Confirmar Eliminación', `¿Está seguro que desea eliminar a ${cliente.nombre}? Esta acción no se puede deshacer.`, 'confirmar', () => {
      this.http.delete(`${this.clientesUrl}/${cliente.id}`).subscribe({
        next: () => {
          this.mostrarAlerta('Eliminado', 'Propietario eliminado correctamente.', 'info');
          if (this.propietarioSeleccionado?.id === cliente.id) {
            this.cerrarSeleccion();
          }
          this.cargar();
        },
        error: (err) => {
          this.mostrarAlerta('Error', 'No se pudo eliminar el propietario. Probablemente tiene expedientes de difuntos o pagos asociados. Elimínelos primero o use otra función.', 'error');
        }
      });
    });
  }
}
