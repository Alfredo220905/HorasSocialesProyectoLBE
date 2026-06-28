import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Gestión de Pagos por Propietario</h2>
    </div>

    <!-- Buscador de Propietario -->
    <div class="card search-card" *ngIf="!propietarioSeleccionado">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="margin: 0; color: #8a1f53;">Seleccionar Propietario o Difunto</h3>
          <p class="text-muted" style="margin-top: 0.3rem;">Busque en la tabla para seleccionar a quién se le aplicará el cobro.</p>
        </div>
        <div class="search-container" style="max-width: 400px; margin: 0; flex-grow: 1; display: flex; flex-direction: column; gap: 0.5rem;">
          <select [(ngModel)]="selectedCementerioId" (change)="onCementerioChange()" class="search-input">
            <option [ngValue]="null">Todos los cementerios</option>
            <option *ngFor="let c of cementerios" [value]="c.id">{{ c.nombre }}</option>
          </select>
          <input type="text" placeholder="Buscar por DUI o Nombre..." 
                 [(ngModel)]="filtroPropietario" 
                 (input)="onSearchPropietarioInput($event)"
                 class="search-input">
        </div>
      </div>
      
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Identificador (DUI/Corr)</th>
              <th>Nombre Completo</th>
              <th>Tipo de Cliente</th>
              <th style="text-align: center;">Acción</th>
            </tr>
          </thead>
          <tbody>
             <tr *ngFor="let item of propietariosPaginados">
                <td style="font-family: monospace; font-size: 0.95rem; color: var(--text-main);">{{ item._displayId }}</td>
                <td><strong style="color: var(--text-main);">{{ item._displayName }}</strong></td>
                <td>
                  <span class="cat-badge" [ngClass]="item._tipo === 'PROPIETARIO' ? 'general' : 'jardin'">
                    {{ item._tipo }}
                  </span>
                </td>
                <td style="text-align: center;">
                  <button class="btn-primary" style="padding: 0.4rem 1rem; font-size: 0.85rem; display: inline-flex;" (click)="seleccionarPropietario(item)">Seleccionar</button>
                </td>
             </tr>
             <tr *ngIf="propietariosPaginados.length === 0">
                <td colspan="4" class="empty">No se encontraron resultados para la búsqueda actual.</td>
             </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination-controls" *ngIf="propietariosFiltrados.length > 0">
        <button [disabled]="paginaActual === 1" (click)="cambiarPagina(paginaActual - 1)">Anterior</button>
        <span style="font-weight: 600; color: var(--text-main);">Página {{ paginaActual }} de {{ totalPaginas }}</span>
        <button [disabled]="paginaActual === totalPaginas" (click)="cambiarPagina(paginaActual + 1)">Siguiente</button>
      </div>
    </div>

    <!-- Panel del Propietario Seleccionado -->
    <div *ngIf="propietarioSeleccionado" class="owner-panel animate-fade-in">
      
      <!-- Datos del Propietario -->
      <div class="card info-card">
        <div class="owner-header">
          <div class="owner-avatar">{{ propietarioSeleccionado.nombre.charAt(0) }}</div>
          <div style="flex-grow: 1;">
            <h3 style="margin: 0; color: #8a1f53; font-size: 1.5rem;">{{ propietarioSeleccionado._displayName }}</h3>
            <p class="text-muted" style="margin: 0.3rem 0 0 0;">
              <strong>{{ propietarioSeleccionado._tipo }}</strong> | 
              <strong>Identificador:</strong> {{ propietarioSeleccionado._displayId }}
            </p>
          </div>
          <button class="btn-secondary" (click)="limpiarSeleccion()">← Cambiar Propietario</button>
        </div>
      </div>

      <div class="main-grid">
        <!-- Columna Izquierda: Historial de Pagos -->
        <div class="card history-card">
          <div class="page-header" style="margin-bottom: 1rem; align-items: center;">
            <div style="display: flex; gap: 1rem; align-items: center;">
              <h3 style="margin:0;">Historial de Pagos</h3>
              <span class="badge" [ngClass]="{'pagado': pagosPendientes === 0, 'pendiente': pagosPendientes > 0}">
                {{ pagosPendientes }} Pendiente(s)
              </span>
            </div>
            <button class="btn-secondary" style="font-size: 0.8rem; padding: 0.4rem 0.8rem; display: flex; align-items: center; gap: 0.3rem; color: #b02a37; border-color: #f8d7da;" 
                    *ngIf="tienePagosPagados" 
                    (click)="limpiarPagados()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              Limpiar Historial
            </button>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let pago of pagosPropietario">
                  <td>{{ pago.fecha }}</td>
                  <td>{{ pago.concepto || 'Pago por Servicios' }}</td>
                  <td><strong>$ {{ pago.monto | number:'1.2-2' }}</strong></td>
                  <td>
                    <span class="badge" [ngClass]="pago.estado?.toLowerCase() === 'pagado' ? 'pagado' : 'pendiente'">
                      {{ pago.estado }}
                    </span>
                  </td>
                  <td class="row-actions">
                    <button class="btn-icon" style="color: #207044; border-color: #a3d9b4; background: #e8f5e9; display: flex; align-items: center; gap: 4px;" *ngIf="pago.estado !== 'PAGADO'" (click)="marcar(pago.id, 'PAGADO')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Cobrar
                    </button>
                    <button class="btn-icon danger" *ngIf="pago.estado !== 'PAGADO'" (click)="eliminar(pago.id)">Eliminar</button>
                  </td>
                </tr>
                <tr *ngIf="pagosPropietario.length === 0">
                  <td colspan="5" class="empty">Este propietario no tiene pagos registrados.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Columna Derecha: Nuevo Pago -->
        <div class="card new-payment-card" style="background: #fffafc; border: 1px solid #fce4f0;">
          <h3 style="color: #d63384; margin-top: 0;">Generar Nuevo Cobro</h3>
          <p class="text-muted" style="margin-bottom: 1.5rem;">Asigne tasas o servicios a la cuenta del propietario.</p>
          
          <div class="multi-select-container">
            <input type="text" placeholder="Buscar o seleccionar catálogo de tasas..." 
                   [(ngModel)]="filtroTasa" 
                   (focus)="mostrarTasas()"
                   (input)="filtrarTasas()"
                   (blur)="ocultarTasasConRetraso()">
            <div class="dropdown-list" *ngIf="mostrarDropdownTasas && tasasFiltradas.length > 0">
              <div class="dropdown-item" *ngFor="let t of tasasFiltradas" (mousedown)="agregarTasa(t)">
                <span class="cat-badge" [ngClass]="t.categoria?.toLowerCase()?.includes('jardin') ? 'jardin' : 'general'">
                  {{ t.categoria || 'SERVICIO' }}
                </span>
                <span style="flex-grow: 1;">{{ t.concepto }}</span>
                <strong>$ {{ t.precioOficial | number:'1.2-2' }}</strong>
              </div>
            </div>
          </div>
          
          <div class="selected-tasas-container" *ngIf="form.tasasSeleccionadas.length > 0">
            <div class="tasa-chip" *ngFor="let t of form.tasasSeleccionadas; let i = index">
              {{ t.concepto }} ($ {{ t.precioOficial | number:'1.2-2' }})
              <span class="remove-tasa" (click)="removerTasa(i)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </span>
            </div>
          </div>
          
          <div class="form-grid" style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <label style="font-size: 0.85rem; color: #8a1f53; font-weight: bold; margin-bottom: 0.3rem; display: block;">Concepto del Cobro</label>
              <input type="text" placeholder="Ej: Renovación anual..." [(ngModel)]="form.concepto">
            </div>
            
            <div style="background: var(--card-bg); padding: 1rem; border-radius: 8px; border: 1px solid #f3c2d9; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-weight: bold; color: #8a1f53;">Total a Cobrar</span>
              <div style="display: flex; align-items: center; gap: 0.2rem;">
                <span style="font-weight: 800; font-size: 1.5rem; color: #d63384;">$</span>
                <input type="number" min="0.01" step="0.01" placeholder="0.00" [(ngModel)]="form.monto" 
                       style="font-size: 1.5rem; font-weight: 800; color: #d63384; border: none; padding: 0; width: 100px; text-align: right; background: transparent; box-shadow: none;">
              </div>
            </div>
          </div>
          
          <div class="actions" style="margin-top: 1.5rem;">
            <button class="btn-primary" style="width: 100%; font-size: 1.1rem; padding: 1rem;" (click)="guardar()">Generar y Añadir a Cuenta</button>
          </div>
          <p class="message error" *ngIf="error">{{ error }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .card { background: var(--card-bg); padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(214,51,132,0.06); margin-bottom: 1rem; }
    
    .search-container { position: relative; width: 100%; max-width: 800px; margin-top: 1rem; }
    .search-input { width: 100%; padding: 1.2rem 1.5rem; font-size: 1.1rem; border: 2px solid #fce4f0; border-radius: 12px; transition: all 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
    .search-input:focus { outline: none; border-color: #d63384; box-shadow: 0 0 0 4px rgba(214,51,132,0.1); }
    
    .owner-header { display: flex; align-items: center; gap: 1.5rem; }
    .owner-avatar { min-width: 60px; width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #d63384, #8a1f53); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 800; box-shadow: 0 4px 10px rgba(214,51,132,0.3); }
    .owner-avatar-small { width: 36px; height: 36px; border-radius: 50%; background: #fce4f0; color: #d63384; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800; }
    
    .main-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 1.5rem; align-items: start; }
    
    input, select { width: 100%; padding: 0.8rem 1rem; border: 1px solid #f3c2d9; border-radius: 8px; font-size: 1rem; background: var(--card-bg); }
    input:focus, select:focus { outline: none; border-color: #d63384; }
    
    .actions, .row-actions { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
    .btn-primary { background: linear-gradient(135deg, #d63384, #a62664); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(214,51,132,0.2); display: flex; align-items: center; justify-content: center; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 15px rgba(214,51,132,0.3); }
    .btn-secondary { background: var(--card-bg); border: 1px solid var(--border-table); color: var(--text-muted); padding: 0.65rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.2s; }
    .btn-secondary:hover { background: var(--table-header-bg); border-color: var(--text-muted); }
    .btn-icon { background: transparent; border: none; padding: 0.5rem; color: var(--text-muted); cursor: pointer; border-radius: 6px; transition: 0.2s; }
    .btn-icon:hover { background: var(--table-header-bg); }
    .btn-icon.danger { color: #b02a37; border-color: #f8d7da; background: var(--card-bg); }
    .btn-icon.danger:hover { background: #fff5f5; }
    
    .table-container { background: var(--card-bg); border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid var(--border-color); }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1.25rem 1rem; color: var(--text-muted); font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; background: var(--table-header-bg); border-bottom: 2px solid var(--border-table); }
    td { padding: 1rem; border-bottom: 1px solid var(--border-table); color: var(--text-main); font-size: 0.95rem; }
    tr:hover td { background: var(--hover-bg); }
    .badge { padding: 0.35rem 0.8rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; display: inline-block; }
    .badge.pagado { background: #dcfce7; color: #166534; }
    .badge.pendiente { background: #fee2e2; color: #991b1b; }
    .empty { text-align: center; color: var(--text-muted); padding: 3rem 1rem !important; font-style: italic; }
    .message.error { color: #b02a37; font-weight: 600; margin-top: 1rem; font-size: 0.9rem; }
    
    .multi-select-container { position: relative; width: 100%; }
    .dropdown-list { position: absolute; top: 100%; left: 0; right: 0; background: var(--card-bg); border: 1px solid var(--border-table); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 20; max-height: 300px; overflow-y: auto; margin-top: 8px; padding: 0.5rem; }
    .dropdown-item { padding: 0.8rem 1rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 1rem; transition: 0.2s; flex-wrap: wrap;}
    .dropdown-item:hover { background: var(--hover-bg); }
    
    .selected-tasas-container { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
    .tasa-chip { display: flex; align-items: center; gap: 0.5rem; background: #fff0f6; color: #d63384; border: 1px solid #fce4f0; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
    .remove-tasa { cursor: pointer; font-weight: bold; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: #fce4f0; color: #d63384; }
    .remove-tasa:hover { background: #d63384; color: white; }
    .text-muted { color: var(--text-muted); font-size: 0.9rem; }
    
    .cat-badge { font-size: 0.7rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; letter-spacing: 0.05em; }
    .jardin { background: #fef9c3; color: #854d0e; }
    .general { background: #e0f2fe; color: #0369a1; }

    .pagination-controls {
      display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 1.5rem; padding: 1rem;
    }
    .pagination-controls button {
      padding: 0.5rem 1rem; border: 1px solid var(--border-color); background: var(--card-bg); border-radius: 8px; cursor: pointer; color: var(--text-main); font-weight: 600;
    }
    .pagination-controls button:disabled {
      opacity: 0.5; cursor: not-allowed;
    }
    .pagination-controls button:not(:disabled):hover {
      background: #f8fafc; border-color: var(--text-muted);
    }

    /* RESPONSIVE MÓVIL */
    @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
    @media (max-width: 768px) {
      .card { padding: 1rem; }
      .owner-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .btn-secondary { width: 100%; }
      th, td { padding: 0.8rem; font-size: 0.85rem; }
      .row-actions { flex-direction: column; align-items: flex-start; }
      .btn-icon { width: 100%; text-align: center; justify-content: center; }
    }
  `]
})
export class PagosComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/pagos`;
  private clientesBusquedaUrl = `${environment.apiUrl}/clientes/buscar`;
  private difuntosBusquedaUrl = `${environment.apiUrl}/difuntos/buscar`;
  private tasasUrl = `${environment.apiUrl}/tasas`;
  
  // Propietarios y Pagos
  filtroPropietario: string = '';
  propietariosFiltrados: any[] = [];
  propietarioSeleccionado: any = null;
  pagosPropietario: any[] = [];
  
  // Paginación de Propietarios
  paginaActual: number = 1;
  itemsPorPagina: number = 5;

  get totalPaginas() {
    return Math.ceil(this.propietariosFiltrados.length / this.itemsPorPagina) || 1;
  }

  get propietariosPaginados() {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.propietariosFiltrados.slice(inicio, inicio + this.itemsPorPagina);
  }

  cambiarPagina(p: number) {
    if (p >= 1 && p <= this.totalPaginas) {
      this.paginaActual = p;
    }
  }
  
  // Tasas
  tasas: any[] = [];
  tasasFiltradas: any[] = [];
  filtroTasa: string = '';
  
  error = '';
  
  form = { 
    monto: null as number | null,
    concepto: '',
    tasasSeleccionadas: [] as any[]
  };

  private searchTimeout: any;

  constructor(private http: HttpClient) {}

  cementerios: any[] = [];
  selectedCementerioId: number | null = null;
  selectedCementerioNombre: string | null = null;

  ngOnInit() {
    this.cargarTasas();
    this.cargarCementerios();
    this.buscarPropietario(); // Cargar la tabla al inicio
  }

  cargarCementerios() {
    this.http.get<any[]>(`${environment.apiUrl}/cementerios`).subscribe(data => {
      this.cementerios = data;
    });
  }

  onCementerioChange() {
    if (this.selectedCementerioId) {
      const c = this.cementerios.find(x => x.id == this.selectedCementerioId);
      this.selectedCementerioNombre = c ? c.nombre : null;
    } else {
      this.selectedCementerioNombre = null;
    }
    this.paginaActual = 1;
    this.buscarPropietario();
  }

  get pagosPendientes() {
    return this.pagosPropietario.filter(p => p.estado === 'PENDIENTE').length;
  }

  onSearchPropietarioInput(event: any) {
    let input = event.target.value;
    
    // Si la entrada contiene solo números y guiones, aplicamos máscara DUI
    if (/^[0-9\-]+$/.test(input) && input.length > 0) {
      let val = input.replace(/\D/g, ''); // quitar no dígitos
      if (val.length > 9) {
          val = val.substring(0, 9); // Limitar a 9 dígitos para DUI
      }
      if (val.length > 8) {
        val = val.substring(0, 8) + '-' + val.substring(8, 9);
      }
      this.filtroPropietario = val;
    } else {
      this.filtroPropietario = input;
    }
    
    this.paginaActual = 1; // Volver a la página 1 al buscar
    this.buscarPropietario();
  }

  buscarPropietario() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    
    const q = this.filtroPropietario ? encodeURIComponent(this.filtroPropietario) : '';
    
    this.searchTimeout = setTimeout(() => {
      const pClientes = this.http.get<any[]>(`${this.clientesBusquedaUrl}?q=${q}`).pipe(catchError(() => of([])));
      const pDifuntos = this.http.get<any[]>(`${this.difuntosBusquedaUrl}?query=${q}`).pipe(catchError(() => of([])));
      
      forkJoin([pClientes, pDifuntos]).subscribe(([clientes, difuntos]) => {
        let mappedClientes = clientes.map(c => ({
            ...c, _tipo: 'PROPIETARIO', _displayName: c.nombre, _displayId: c.dui
        }));
        let mappedDifuntos = difuntos.map(d => ({
            ...d, _tipo: 'DIFUNTO', _displayName: d.nombre, _displayId: d.dui || d.correlativo || 'No registrado'
        }));
        
        if (this.selectedCementerioId) {
           // Si se selecciona un cementerio, filtramos por él.
           // Difuntos: tienen cementerioNombre
           mappedDifuntos = mappedDifuntos.filter(d => d.cementerioNombre === this.selectedCementerioNombre);
           // Clientes: añadí getCementerioId() al backend para poder filtrar por ID
           mappedClientes = mappedClientes.filter(c => c.cementerioId === this.selectedCementerioId);
        }

        this.propietariosFiltrados = [...mappedClientes, ...mappedDifuntos];
      });
    }, 300);
  }

  seleccionarPropietario(propietario: any) {
    this.propietarioSeleccionado = propietario;
    this.filtroPropietario = '';
    this.propietariosFiltrados = [];
    this.cargarPagosPropietario();
  }

  limpiarSeleccion() {
    this.propietarioSeleccionado = null;
    this.pagosPropietario = [];
    this.cancelar();
  }

  cargarPagosPropietario() {
    if (!this.propietarioSeleccionado) return;
    if (this.propietarioSeleccionado._tipo === 'DIFUNTO') {
       this.http.get<any[]>(`${this.apiUrl}/difunto/${this.propietarioSeleccionado.id}`)
         .subscribe(data => this.pagosPropietario = data);
    } else {
       this.http.get<any[]>(`${this.apiUrl}/cliente/${this.propietarioSeleccionado.id}`)
         .subscribe(data => this.pagosPropietario = data);
    }
  }

  cargarTasas() {
    this.http.get<any[]>(this.tasasUrl).subscribe(data => {
      this.tasas = data;
      this.tasasFiltradas = [...this.tasas];
    });
  }

  mostrarDropdownTasas = false;

  mostrarTasas() {
    this.mostrarDropdownTasas = true;
    this.filtrarTasas();
  }

  ocultarTasasConRetraso() {
    setTimeout(() => {
      this.mostrarDropdownTasas = false;
    }, 150);
  }

  filtrarTasas() {
    if (!this.filtroTasa) {
      this.tasasFiltradas = [...this.tasas];
      return;
    }
    const term = this.filtroTasa.toLowerCase();
    this.tasasFiltradas = this.tasas.filter(t => 
      (t.concepto && t.concepto.toLowerCase().includes(term)) || 
      (t.categoria && t.categoria.toLowerCase().includes(term))
    );
  }

  agregarTasa(tasa: any) {
    this.form.tasasSeleccionadas.push(tasa);
    this.filtroTasa = '';
    this.tasasFiltradas = [];
    this.recalcularTotal();
  }

  removerTasa(index: number) {
    this.form.tasasSeleccionadas.splice(index, 1);
    this.recalcularTotal();
  }

  recalcularTotal() {
    let total = 0;
    let conceptos: string[] = [];
    this.form.tasasSeleccionadas.forEach(t => {
      total += Number(t.precioOficial || 0);
      conceptos.push(t.concepto);
    });
    this.form.monto = total > 0 ? parseFloat(total.toFixed(2)) : null;
    this.form.concepto = conceptos.join(' + ');
  }

  guardar() {
    this.error = '';
    if (!this.propietarioSeleccionado || !this.form.monto) {
      this.error = 'Debe especificar un monto.';
      return;
    }
    
    const payload: any = {
      monto: this.form.monto,
      concepto: this.form.concepto,
      estado: 'PENDIENTE'
    };
    
    if (this.propietarioSeleccionado._tipo === 'DIFUNTO') {
        payload.difuntoId = this.propietarioSeleccionado.id;
    } else {
        payload.clienteId = this.propietarioSeleccionado.id;
    }

    this.http.post(this.apiUrl, payload).subscribe({
      next: () => {
        this.cancelar();
        this.cargarPagosPropietario();
      },
      error: err => this.error = err.error?.message || err.error?.error || 'No se pudo registrar el pago.'
    });
  }

  marcar(id: number, estado: string) {
    this.http.put(`${this.apiUrl}/${id}/estado?estado=${estado}`, {}).subscribe(() => this.cargarPagosPropietario());
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar este registro de pago?')) return;
    this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => this.cargarPagosPropietario());
  }

  get tienePagosPagados() {
    return this.pagosPropietario.some(p => p.estado === 'PAGADO');
  }

  limpiarPagados() {
    const pagados = this.pagosPropietario.filter(p => p.estado === 'PAGADO');
    if (pagados.length === 0) return;
    if (!confirm('¿Está seguro que desea limpiar todos los registros de pagos ya completados de este historial?')) return;
    
    const requests = pagados.map(p => this.http.delete(`${this.apiUrl}/${p.id}`));
    forkJoin(requests).subscribe({
      next: () => this.cargarPagosPropietario(),
      error: () => alert('Ocurrió un error al limpiar algunos registros.')
    });
  }

  cancelar() {
    this.form = { monto: null, concepto: '', tasasSeleccionadas: [] };
    this.filtroTasa = '';
    this.tasasFiltradas = [];
    this.error = '';
  }
}
