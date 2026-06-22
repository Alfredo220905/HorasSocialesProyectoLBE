import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
          <input type="text" placeholder="Buscar propietario por nombre o DUI..." [(ngModel)]="filtro">
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
          <h3>{{ propietarioSeleccionado.nombre }}</h3>
          <span class="badge">DUI: {{ propietarioSeleccionado.dui }}</span>
          <button class="close-btn" (click)="cerrarSeleccion()">×</button>
        </div>
        
        <div class="info-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: start;">
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
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }

    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .card { background: #fff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(214,51,132,0.06); margin-bottom: 1rem; }
    
    .main-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; transition: all 0.3s ease; }
    .main-grid.has-selection { grid-template-columns: 1fr 1fr; }
    @media (max-width: 1000px) { .main-grid.has-selection { grid-template-columns: 1fr; } }

    .search-bar { margin-bottom: 1.2rem; }
    input { width: 100%; padding: 1rem 1.2rem; border: 2px solid #fce4f0; border-radius: 12px; font-size: 1.05rem; transition: 0.2s; }
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
    
    .difuntos-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem; }
    .difunto-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; background: #f8fafc; transition: 0.2s; border-left: 4px solid #d63384; }
    .difunto-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); transform: translateY(-2px); }
    .difunto-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
    .difunto-header h5 { margin: 0; font-size: 1.1rem; color: #1e293b; }
    .status-badge { font-size: 0.7rem; background: #e0f2fe; color: #0369a1; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; }
    
    .difunto-body { display: flex; flex-direction: column; gap: 0.3rem; }
    .data-row { display: flex; justify-content: space-between; font-size: 0.85rem; border-bottom: 1px dashed #e2e8f0; padding-bottom: 0.2rem; }
    .data-row span { color: #64748b; }
    .data-row strong { color: #334155; text-align: right; }
    
    .empty-state { padding: 2rem; text-align: center; color: #94a3b8; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; margin-top: 1rem; }
    .empty { text-align: center; color: #94a3b8; padding: 3rem !important; }
  `]
})
export class ClientesComponent implements OnInit {
  private clientesUrl = 'http://localhost:8081/api/clientes';
  private difuntosUrl = 'http://localhost:8081/api/difuntos/cliente';
  
  filtro = '';
  clientes: Cliente[] = [];
  
  propietarioSeleccionado: Cliente | null = null;
  difuntos: any[] = [];
  cargandoDifuntos = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargar();
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
}
