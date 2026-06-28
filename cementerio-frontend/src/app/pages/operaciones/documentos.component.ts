import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-documentos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h2>Archivo de Documentos</h2>
      <button class="btn-primary" (click)="mostrarFormulario = true">+ Cargar Documento</button>
    </div>

    <div class="card" *ngIf="mostrarFormulario">
      <div class="form-grid">
        <select [(ngModel)]="form.tipoEntidad">
          <option value="cliente">Cliente (Privado)</option>
          <option value="difunto">Difunto (Público/Privado)</option>
        </select>
        <select *ngIf="form.tipoEntidad === 'cliente'" [(ngModel)]="form.clienteId">
          <option [ngValue]="null">Seleccione cliente</option>
          <option *ngFor="let cliente of clientes" [ngValue]="cliente.id">{{ cliente.nombre }} - {{ cliente.dui }}</option>
        </select>
        <select *ngIf="form.tipoEntidad === 'difunto'" [(ngModel)]="form.difuntoId">
          <option [ngValue]="null">Seleccione difunto</option>
          <option *ngFor="let difunto of difuntos" [ngValue]="difunto.id">{{ difunto.nombre }}</option>
        </select>
        <input type="text" placeholder="Nombre del documento" [(ngModel)]="form.nombre">
        <input type="file" (change)="onFileSelected($event)">
      </div>
      <div class="actions">
        <button class="btn-primary" (click)="guardar()">Guardar</button>
        <button class="btn-secondary" (click)="cancelar()">Cancelar</button>
      </div>
      <p class="message error" *ngIf="error">{{ error }}</p>
    </div>

    <div class="card">
      <div class="search-bar">
        <input type="text" placeholder="Buscar por cliente o documento..." [(ngModel)]="filtro">
      </div>

      <div class="docs-grid">
        <div class="doc-card" *ngFor="let doc of documentosFiltrados">
          <div class="doc-icon">DOC</div>
          <div class="doc-info">
            <span class="doc-name">{{ doc.nombre }}</span>
            <span class="doc-client" *ngIf="doc.cliente">Cliente: {{ doc.cliente.nombre }}</span>
            <span class="doc-client" *ngIf="doc.difunto">Difunto: {{ doc.difunto.nombre }}</span>
            <span class="doc-status" [ngClass]="doc.estado?.toLowerCase()">{{ doc.estado }}</span>
            <a *ngIf="doc.base64Archivo" [href]="doc.base64Archivo" download="documento.pdf" class="btn-text">Descargar Archivo</a>
          </div>
          <div class="doc-actions">
            <button class="btn-text" *ngIf="doc.estado !== 'COMPLETADO'" (click)="marcar(doc.id, 'completar')">Completar</button>
            <button class="btn-text" *ngIf="doc.estado !== 'PENDIENTE'" (click)="marcar(doc.id, 'pendiente')">Pendiente</button>
            <button class="btn-text danger" (click)="eliminar(doc.id)">Eliminar</button>
          </div>
        </div>
      </div>
      <p class="empty" *ngIf="documentosFiltrados.length === 0">No hay documentos para mostrar.</p>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .card { background: var(--card-bg); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(214,51,132,0.08); margin-bottom: 1rem; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
    input, select { width: 100%; padding: 0.8rem 1rem; border: 1px solid #f3c2d9; border-radius: 8px; font-size: 1rem; background: var(--card-bg); }
    input:focus, select:focus { outline: none; border-color: #d63384; box-shadow: 0 0 0 3px rgba(214,51,132,0.12); }
    .actions { display: flex; gap: 0.6rem; align-items: center; margin-top: 1rem; }
    .btn-primary { background: #d63384; color: #fff; border: none; padding: 0.75rem 1.2rem; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-secondary { background: var(--card-bg); color: #d63384; border: 1px solid #d63384; padding: 0.75rem 1.2rem; border-radius: 8px; cursor: pointer; }
    .search-bar { margin-bottom: 1.5rem; }
    .docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .doc-card { border: 1px solid #f3c2d9; padding: 1rem; border-radius: 8px; display: flex; gap: 1rem; align-items: center; background: var(--card-bg); }
    .doc-icon { min-width: 48px; height: 48px; border-radius: 8px; background: #fff0f6; color: #d63384; display: grid; place-items: center; font-weight: 800; }
    .doc-info { display: flex; flex-direction: column; flex: 1; gap: 0.25rem; }
    .doc-name { font-weight: 700; color: #3b2430; }
    .doc-client { font-size: 0.9rem; color: #666; }
    .doc-status { width: fit-content; padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.75rem; font-weight: 800; }
    .doc-status.completado { background: #e8f5e9; color: #207044; }
    .doc-status.pendiente { background: #fff0f6; color: #d63384; }
    .doc-actions { display: flex; flex-direction: column; gap: 0.35rem; align-items: flex-end; }
    .btn-text { background: none; border: none; color: #d63384; font-weight: 700; cursor: pointer; text-align: right; }
    .btn-text.danger { color: #b02a37; }
    .empty { text-align: center; color: #777; }
    .message.error { color: #b02a37; font-weight: 600; }
  `]
})
export class DocumentosComponent implements OnInit {
  private apiUrl = `${environment.apiUrl}/documentos`;
  private difuntosUrl = `${environment.apiUrl}/difuntos`;
  private clientesUrl = `${environment.apiUrl}/clientes`;
  filtro = '';
  documentos: any[] = [];
  clientes: any[] = [];
  difuntos: any[] = [];
  mostrarFormulario = false;
  error = '';
  form = { tipoEntidad: 'cliente', clienteId: null as number | null, difuntoId: null as number | null, nombre: '', base64Archivo: '' };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargar();
  }

  get documentosFiltrados() {
    const term = this.filtro.toLowerCase().trim();
    if (!term) return this.documentos;
    return this.documentos.filter(d =>
      (d.nombre || '').toLowerCase().includes(term) ||
      (d.cliente?.nombre || '').toLowerCase().includes(term)
    );
  }

  cargar() {
    this.http.get<any[]>(this.apiUrl).subscribe(data => this.documentos = data);
    this.http.get<any[]>(this.clientesUrl).subscribe(data => this.clientes = data);
    this.http.get<any[]>(this.difuntosUrl).subscribe(data => this.difuntos = data);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.form.base64Archivo = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  guardar() {
    this.error = '';
    if (this.form.tipoEntidad === 'cliente' && !this.form.clienteId) {
      this.error = 'Seleccione cliente.'; return;
    }
    if (this.form.tipoEntidad === 'difunto' && !this.form.difuntoId) {
      this.error = 'Seleccione difunto.'; return;
    }
    if (!this.form.nombre.trim()) {
      this.error = 'Escriba el nombre del documento.'; return;
    }
    const params: any = { nombre: this.form.nombre };
    if (this.form.tipoEntidad === 'cliente') params.clienteId = this.form.clienteId;
    if (this.form.tipoEntidad === 'difunto') params.difuntoId = this.form.difuntoId;
    if (this.form.base64Archivo) params.base64Archivo = this.form.base64Archivo;

    this.http.post(this.apiUrl, null, { params }).subscribe({
      next: () => {
        this.cancelar();
        this.cargar();
      },
      error: err => this.error = err.error?.message || err.error?.error || 'No se pudo guardar el documento.'
    });
  }

  marcar(id: number, estado: 'completar' | 'pendiente') {
    this.http.put(`${this.apiUrl}/${id}/${estado}`, {}).subscribe(() => this.cargar());
  }

  eliminar(id: number) {
    if (!confirm('Eliminar este documento?')) return;
    this.http.delete(`${this.apiUrl}/${id}`).subscribe(() => this.cargar());
  }

  cancelar() {
    this.mostrarFormulario = false;
    this.form = { tipoEntidad: 'cliente', clienteId: null, difuntoId: null, nombre: '', base64Archivo: '' };
  }
}
