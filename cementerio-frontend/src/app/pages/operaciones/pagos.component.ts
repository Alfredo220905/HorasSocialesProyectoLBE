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
      <h3>Buscar Propietario</h3>
      <p class="text-muted">Busque al cliente por nombre o DUI para ver o registrar sus pagos.</p>
      
      <div class="search-container">
        <input type="text" placeholder="Buscar o seleccionar propietario (DUI o Nombre)..." 
               [(ngModel)]="filtroPropietario" 
               (focus)="mostrarPropietarios()"
               (input)="onSearchPropietarioInput($event)"
               (blur)="ocultarPropietariosConRetraso()"
               class="search-input">
        
        <div class="dropdown-list" *ngIf="mostrarDropdownPropietario && propietariosFiltrados.length > 0">
          <div class="dropdown-item" *ngFor="let item of propietariosFiltrados" (mousedown)="seleccionarPropietario(item)">
            <div class="owner-avatar-small">{{ item._displayName?.charAt(0) || '?' }}</div>
            <div style="flex-grow: 1;">
              <strong>{{ item._displayName }}</strong> 
              <span class="cat-badge" [ngClass]="item._tipo === 'PROPIETARIO' ? 'general' : 'jardin'" style="margin-left: 0.5rem;">
                {{ item._tipo }}
              </span>
              <br>
              <span class="text-muted" style="font-size: 0.8rem;">Identificador: {{ item._displayId }}</span>
            </div>
            <button class="btn-primary" style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">Seleccionar</button>
          </div>
        </div>
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
          <div class="page-header" style="margin-bottom: 1rem;">
            <h3 style="margin:0;">Historial de Pagos</h3>
            <span class="badge" [ngClass]="{'pagado': pagosPendientes === 0, 'pendiente': pagosPendientes > 0}">
              {{ pagosPendientes }} Pendiente(s)
            </span>
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
                    <button class="btn-icon" style="color: #207044; border-color: #a3d9b4; background: #e8f5e9;" *ngIf="pago.estado !== 'PAGADO'" (click)="marcar(pago.id, 'PAGADO')">✓ Cobrar</button>
                    <button class="btn-icon danger" (click)="eliminar(pago.id)">Eliminar</button>
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
              <span class="remove-tasa" (click)="removerTasa(i)">×</span>
            </div>
          </div>
          
          <div class="form-grid" style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <label style="font-size: 0.85rem; color: #8a1f53; font-weight: bold; margin-bottom: 0.3rem; display: block;">Concepto del Cobro</label>
              <input type="text" placeholder="Ej: Renovación anual..." [(ngModel)]="form.concepto">
            </div>
            
            <div style="background: #fff; padding: 1rem; border-radius: 8px; border: 1px solid #f3c2d9; display: flex; align-items: center; justify-content: space-between;">
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
    .card { background: #fff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(214,51,132,0.06); margin-bottom: 1rem; }
    
    .search-container { position: relative; width: 100%; max-width: 800px; margin-top: 1rem; }
    .search-input { width: 100%; padding: 1.2rem 1.5rem; font-size: 1.1rem; border: 2px solid #fce4f0; border-radius: 12px; transition: all 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.02); }
    .search-input:focus { outline: none; border-color: #d63384; box-shadow: 0 0 0 4px rgba(214,51,132,0.1); }
    
    .owner-header { display: flex; align-items: center; gap: 1.5rem; }
    .owner-avatar { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #d63384, #8a1f53); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; font-weight: 800; box-shadow: 0 4px 10px rgba(214,51,132,0.3); }
    .owner-avatar-small { width: 36px; height: 36px; border-radius: 50%; background: #fce4f0; color: #d63384; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 800; }
    
    .main-grid { display: grid; grid-template-columns: 3fr 2fr; gap: 1.5rem; align-items: start; }
    @media (max-width: 1000px) { .main-grid { grid-template-columns: 1fr; } }
    
    input, select { width: 100%; padding: 0.8rem 1rem; border: 1px solid #f3c2d9; border-radius: 8px; font-size: 1rem; background: #fff; }
    input:focus, select:focus { outline: none; border-color: #d63384; }
    
    .actions, .row-actions { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
    .btn-primary { background: linear-gradient(135deg, #d63384, #a62664); color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 10px rgba(214,51,132,0.2); }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 15px rgba(214,51,132,0.3); }
    .btn-secondary { background: #fff; color: #8a1f53; border: 1px solid #e2e8f0; padding: 0.65rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: 0.2s; }
    .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }
    .btn-icon { padding: 0.45rem 0.8rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.85rem; color: #475569; transition: 0.2s; }
    .btn-icon:hover { background: #f8fafc; }
    .btn-icon.danger { color: #b02a37; border-color: #f8d7da; background: #fff; }
    .btn-icon.danger:hover { background: #fff5f5; }
    
    .table-container { overflow-x: auto; border: 1px solid #f1f5f9; border-radius: 8px; }
    .data-table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 1rem; border-bottom: 1px solid #f1f5f9; }
    th { color: #64748b; font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; }
    .badge { padding: 0.35rem 0.8rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; display: inline-block; }
    .badge.pagado { background: #dcfce7; color: #166534; }
    .badge.pendiente { background: #fee2e2; color: #991b1b; }
    .empty { text-align: center; color: #94a3b8; padding: 3rem 1rem !important; font-style: italic; }
    .message.error { color: #b02a37; font-weight: 600; margin-top: 1rem; font-size: 0.9rem; }
    
    /* Buscador Dropdown */
    .multi-select-container { position: relative; width: 100%; }
    .dropdown-list { position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 20; max-height: 300px; overflow-y: auto; margin-top: 8px; padding: 0.5rem; }
    .dropdown-item { padding: 0.8rem 1rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 1rem; transition: 0.2s; }
    .dropdown-item:hover { background: #f8fafc; }
    
    /* Chips Seleccionados */
    .selected-tasas-container { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
    .tasa-chip { display: flex; align-items: center; gap: 0.5rem; background: #fff0f6; color: #d63384; border: 1px solid #fce4f0; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600; }
    .remove-tasa { cursor: pointer; font-weight: bold; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: all 0.2s; background: #fce4f0; color: #d63384; }
    .remove-tasa:hover { background: #d63384; color: white; }
    .text-muted { color: #64748b; font-size: 0.9rem; }
    
    .cat-badge { font-size: 0.7rem; font-weight: 800; padding: 0.25rem 0.6rem; border-radius: 4px; letter-spacing: 0.05em; }
    .jardin { background: #fef9c3; color: #854d0e; }
    .general { background: #e0f2fe; color: #0369a1; }
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

  ngOnInit() {
    this.cargarTasas();
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
    
    this.buscarPropietario();
  }

  mostrarDropdownPropietario = false;

  mostrarPropietarios() {
    this.mostrarDropdownPropietario = true;
    this.buscarPropietario();
  }

  ocultarPropietariosConRetraso() {
    setTimeout(() => {
      this.mostrarDropdownPropietario = false;
    }, 150);
  }

  buscarPropietario() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    
    const q = this.filtroPropietario ? encodeURIComponent(this.filtroPropietario) : '';
    
    this.searchTimeout = setTimeout(() => {
      const pClientes = this.http.get<any[]>(`${this.clientesBusquedaUrl}?q=${q}`).pipe(catchError(() => of([])));
      const pDifuntos = this.http.get<any[]>(`${this.difuntosBusquedaUrl}?query=${q}`).pipe(catchError(() => of([])));
      
      forkJoin([pClientes, pDifuntos]).subscribe(([clientes, difuntos]) => {
        const mappedClientes = clientes.map(c => ({
            ...c, _tipo: 'PROPIETARIO', _displayName: c.nombre, _displayId: c.dui
        }));
        const mappedDifuntos = difuntos.map(d => ({
            ...d, _tipo: 'DIFUNTO', _displayName: d.nombre, _displayId: d.dui || d.correlativo || 'N/A'
        }));
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

  cancelar() {
    this.form = { monto: null, concepto: '', tasasSeleccionadas: [] };
    this.filtroTasa = '';
    this.tasasFiltradas = [];
    this.error = '';
  }
}
