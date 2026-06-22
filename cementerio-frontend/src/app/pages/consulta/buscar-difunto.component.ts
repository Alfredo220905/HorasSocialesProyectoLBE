import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DifuntoService, DifuntoDTO } from '../../services/difunto.service';

@Component({
  selector: 'app-buscar-difunto',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-container">
      <div class="hero-section">
        <h1>Búsqueda de Difuntos</h1>
        <p>Encuentre la ubicación exacta de sus seres queridos en nuestros cementerios.</p>
      </div>

      <div class="search-box">
        <input type="text" placeholder="Nombre del difunto o DUI del propietario..." [(ngModel)]="query" (input)="onSearchInput($event)" (keyup.enter)="buscar()">
        <button class="btn-search" (click)="buscar()">BUSCAR</button>
      </div>

      <div class="results-container" *ngIf="buscado">
        <div class="result-card" *ngFor="let res of resultados">
          <div class="result-header">
            <h3>{{ res.nombre }}</h3>
            <span class="date">Fallecido: {{ res.fechaFallecimiento || 'N/A' }}</span>
          </div>
          <div class="result-body">
            <div class="info-item" *ngIf="res.dui">
              <span class="label">DUI del Difunto:</span>
              <span class="value">{{ res.dui }}</span>
            </div>
            <div class="info-item">
              <span class="label">Nacimiento:</span>
              <span class="value">{{ res.fechaNacimiento || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Entierro:</span>
              <span class="value">{{ res.fechaEntierro || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Cementerio:</span>
              <span class="value">{{ res.cementerioNombre || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Ubicación (Parcela/Lote):</span>
              <span class="value">{{ res.ubicacion }}</span>
            </div>
            
            <ng-container *ngIf="res.tipoCementerio === 'Privado'">
              <div class="info-item">
                <span class="label">Propietario (Otorgó beneficio):</span>
                <span class="value">{{ res.dueno }} <span *ngIf="res.duenoDui" style="font-size: 0.85em;">({{ res.duenoDui }})</span></span>
              </div>
              <div class="info-item">
                <span class="label">Estado de Pago:</span>
                <span class="value" [class.text-error]="res.estadoPago === 'PENDIENTE'" [class.text-success]="res.estadoPago === 'AL DÍA'">
                  {{ res.estadoPago }}
                </span>
              </div>
            </ng-container>
            
            <div class="info-item" *ngIf="res.documentos?.length">
              <span class="label" style="width:100%; display:block; margin-bottom:0.5rem;">Documentos Adjuntos:</span>
              <ul style="margin:0; padding-left:1.5rem; color:#4b5563;">
                <li *ngFor="let doc of res.documentos">
                  📄 <a href="javascript:void(0)" (click)="verDocumento(doc)" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">{{ doc.nombre }}</a>
                </li>
              </ul>
            </div>
          </div>

          <div class="cripta-section" *ngIf="res.tipoCementerio === 'Privado' && res.companerosCripta?.length">
            <span class="section-label">Ocupación de Cripta (Compañeros)</span>
            <div class="cripta-grid">
              <div class="cripta-slot" *ngFor="let comp of res.companerosCripta" [class.ocupado]="comp.estado === 'OCUPADO'" [class.libre]="comp.estado !== 'OCUPADO'">
                <span class="slot-num">N° {{ comp.numero }}</span>
                <span class="slot-status">{{ comp.estado === 'OCUPADO' ? 'Ocupado' : 'Libre' }}</span>
                <span class="slot-name" *ngIf="comp.difuntoNombre" [title]="comp.difuntoNombre">{{ comp.difuntoNombre }}</span>
              </div>
            </div>
          </div>
          <button class="btn-ver-mas" (click)="verMas(res)">👁️ Ver Más</button>
        </div>

        <div class="no-results" *ngIf="resultados.length === 0">
          <p>No se encontraron resultados para "{{ query }}"</p>
        </div>
      </div>
    </div>

    <!-- Modal Ver Más -->
    <div class="modal-overlay" *ngIf="difuntoSeleccionado" (click)="cerrarModal()">
      <div class="modal-detail" (click)="$event.stopPropagation()">
        <div class="modal-detail-header">
          <h2>{{ difuntoSeleccionado.nombre }}</h2>
          <button class="btn-close-modal" (click)="cerrarModal()">✕</button>
        </div>
        <div class="modal-detail-body">
          <div class="detail-section">
            <h3>Datos Personales</h3>
            <div class="detail-grid">
              <div class="detail-item" *ngIf="difuntoSeleccionado.dui">
                <span class="dlabel">DUI del Difunto</span>
                <span class="dvalue">{{ difuntoSeleccionado.dui }}</span>
              </div>
              <div class="detail-item">
                <span class="dlabel">Fecha de Nacimiento</span>
                <span class="dvalue">{{ difuntoSeleccionado.fechaNacimiento || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="dlabel">Fecha de Fallecimiento</span>
                <span class="dvalue">{{ difuntoSeleccionado.fechaFallecimiento || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="dlabel">Fecha de Entierro</span>
                <span class="dvalue">{{ difuntoSeleccionado.fechaEntierro || 'N/A' }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Ubicación</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="dlabel">Cementerio</span>
                <span class="dvalue">{{ difuntoSeleccionado.cementerioNombre || 'N/A' }}</span>
              </div>
              <div class="detail-item">
                <span class="dlabel">Tipo</span>
                <span class="dvalue" [class.tipo-privado]="difuntoSeleccionado.tipoCementerio === 'Privado'" [class.tipo-publico]="difuntoSeleccionado.tipoCementerio !== 'Privado'">
                  {{ difuntoSeleccionado.tipoCementerio }}
                </span>
              </div>
              <div class="detail-item" style="grid-column: 1 / -1;">
                <span class="dlabel">Ubicación Exacta</span>
                <span class="dvalue">{{ difuntoSeleccionado.ubicacion }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" *ngIf="difuntoSeleccionado.tipoCementerio === 'Privado'">
            <h3>Propietario y Beneficiarios</h3>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="dlabel">Propietario</span>
                <span class="dvalue">{{ difuntoSeleccionado.dueno }} <span *ngIf="difuntoSeleccionado.duenoDui" style="font-size:0.85em; color:#6b7280;">({{ difuntoSeleccionado.duenoDui }})</span></span>
              </div>
              <div class="detail-item">
                <span class="dlabel">Estado de Pago</span>
                <span class="dvalue" [class.text-error]="difuntoSeleccionado.estadoPago === 'PENDIENTE'" [class.text-success]="difuntoSeleccionado.estadoPago === 'AL DÍA'">{{ difuntoSeleccionado.estadoPago }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" *ngIf="difuntoSeleccionado.tipoCementerio === 'Privado' && difuntoSeleccionado.companerosCripta?.length">
            <h3>Compañeros de Cripta</h3>
            <div class="cripta-grid">
              <div class="cripta-slot" *ngFor="let comp of difuntoSeleccionado.companerosCripta" [class.ocupado]="comp.estado === 'OCUPADO'" [class.libre]="comp.estado !== 'OCUPADO'">
                <span class="slot-num">N° {{ comp.numero }}</span>
                <span class="slot-status">{{ comp.estado === 'OCUPADO' ? 'Ocupado' : 'Libre' }}</span>
                <span class="slot-name" *ngIf="comp.difuntoNombre" [title]="comp.difuntoNombre">{{ comp.difuntoNombre }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section" *ngIf="difuntoSeleccionado.documentos?.length">
            <h3>Documentos Adjuntos</h3>
            <ul class="doc-list">
              <li *ngFor="let doc of difuntoSeleccionado.documentos" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; background: #f8fafc; padding: 0.5rem; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div>
                  📄 <a href="javascript:void(0)" (click)="verDocumento(doc)" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">{{ doc.nombre }}</a>
                </div>
                <button *ngIf="isAdmin" class="btn-close-modal" style="font-size: 1rem; color: #ef4444;" (click)="eliminarDocumento(doc, difuntoSeleccionado)" title="Eliminar documento">✕</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    .hero-section {
      text-align: center;
      margin-bottom: 3rem;
    }
    .hero-section h1 {
      font-size: 2.5rem;
      color: #2c3e50;
      margin-bottom: 1rem;
    }
    .hero-section p {
      color: #7f8c8d;
      font-size: 1.1rem;
    }
    .search-box {
      display: flex;
      gap: 10px;
      background: white;
      padding: 10px;
      border-radius: 50px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      margin-bottom: 4rem;
    }
    .search-box input {
      flex: 1;
      border: none;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      border-radius: 50px;
      outline: none;
    }
    .btn-search {
      background: #2c3e50;
      color: white;
      border: none;
      padding: 0 2rem;
      border-radius: 50px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.3s;
    }
    .btn-search:hover {
      background: #34495e;
    }

    .result-card {
      background: white;
      border-radius: 15px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      border-left: 5px solid #2c3e50;
    }
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .result-header h3 { margin: 0; color: #2c3e50; }
    .date { color: #95a5a6; font-size: 0.9rem; }
    
    .result-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .info-item .label {
      display: block;
      font-size: 0.8rem;
      color: #95a5a6;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .info-item .value {
      font-weight: 600;
      color: #34495e;
    }
    .btn-ver-mas {
      width: 100%;
      background: #f0f4ff;
      border: 1.5px solid #c7d2fe;
      padding: 0.8rem;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
      color: #4f46e5;
      transition: all 0.2s;
    }
    .btn-ver-mas:hover { background: #4f46e5; color: white; border-color: #4f46e5; }
    .no-results {
      text-align: center;
      color: #95a5a6;
      padding: 3rem;
    }
    .text-error { color: #ef4444; font-weight: bold; }
    .text-success { color: #10b981; font-weight: bold; }
    
    /* Cripta section styles */
    .cripta-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #f1f5f9; margin-bottom: 1.5rem; }
    .section-label { font-size: 0.85rem; font-weight: 700; color: #95a5a6; text-transform: uppercase; margin-bottom: 0.75rem; display: block; }
    .cripta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-top: 0.75rem; }
    .cripta-slot { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.5rem; text-align: center; display: flex; flex-direction: column; gap: 4px; }
    .cripta-slot.ocupado { background: #fee2e2; border-color: #fca5a5; }
    .cripta-slot.libre { background: #f0fdf4; border-color: #86efac; }
    .slot-num { font-size: 0.75rem; font-weight: 700; color: #6b7280; }
    .slot-status { font-size: 0.7rem; text-transform: uppercase; font-weight: 800; }
    .cripta-slot.ocupado .slot-status { color: #dc2626; }
    .cripta-slot.libre .slot-status { color: #16a34a; }
    .slot-name { font-size: 0.75rem; font-weight: 600; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Modal Ver Más */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.55); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease; }
    .modal-detail { background: white; border-radius: 16px; width: 90%; max-width: 640px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-detail-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; border-bottom: 1px solid #f1f5f9; }
    .modal-detail-header h2 { margin: 0; color: #1e293b; font-size: 1.4rem; }
    .btn-close-modal { background: none; border: none; font-size: 1.3rem; cursor: pointer; color: #94a3b8; transition: color 0.2s; }
    .btn-close-modal:hover { color: #ef4444; }
    .modal-detail-body { padding: 1.5rem 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .detail-section h3 { margin: 0 0 1rem 0; font-size: 0.85rem; text-transform: uppercase; color: #94a3b8; font-weight: 700; letter-spacing: 0.05em; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .dlabel { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
    .dvalue { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
    .tipo-privado { color: #9333ea; }
    .tipo-publico { color: #2563eb; }
    .doc-list { margin: 0; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class BuscarDifuntoComponent implements OnInit {
  query = '';
  buscado = false;
  resultados: DifuntoDTO[] = [];
  cargando = false;
  difuntoSeleccionado: DifuntoDTO | null = null;
  isAdmin = false;

  constructor(private difuntoService: DifuntoService) {}

  ngOnInit() {
    const rol = localStorage.getItem('rol');
    this.isAdmin = rol === 'ADMIN' || rol === 'ADMINISTRADOR';
  }

  onSearchInput(event: any) {
    let val = event.target.value;
    // Si contiene letras, no formateamos, ya que podría estar buscando por nombre.
    // Solo formateamos si empieza con un número y contiene solo números y guiones.
    if (/^[\d-]+$/.test(val)) {
      val = val.replace(/\D/g, ''); // Remover todo lo que no sea dígito
      if (val.length > 8) {
        val = val.substring(0, 8) + '-' + val.substring(8, 9);
      }
      this.query = val;
      event.target.value = val;
    }
  }

  verMas(d: DifuntoDTO) {
    this.difuntoSeleccionado = d;
  }

  cerrarModal() {
    this.difuntoSeleccionado = null;
  }

  buscar() {
    if (!this.query.trim()) return;
    this.buscado = true;
    this.cargando = true;
    this.difuntoService.buscarDifuntos(this.query).subscribe({
      next: (data) => {
        this.resultados = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

  verDocumento(doc: any) {
    if (!doc.data) {
      alert('El documento no tiene datos válidos.');
      return;
    }
    let mimeType = 'application/octet-stream';
    if (doc.nombre.toLowerCase().endsWith('.pdf')) mimeType = 'application/pdf';
    else if (doc.nombre.toLowerCase().endsWith('.png')) mimeType = 'image/png';
    else if (doc.nombre.toLowerCase().endsWith('.jpg') || doc.nombre.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
    else if (doc.nombre.toLowerCase().endsWith('.doc') || doc.nombre.toLowerCase().endsWith('.docx')) mimeType = 'application/msword';

    const src = `data:${mimeType};base64,${doc.data}`;
    const link = document.createElement("a");
    link.href = src;
    link.download = doc.nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  eliminarDocumento(doc: any, difunto: DifuntoDTO) {
    if (!doc.id) {
      alert('Este documento antiguo no se puede eliminar de forma individual.');
      return;
    }
    if (!confirm('¿Está seguro de que desea eliminar este documento?')) return;
    
    // Call the API endpoint (requires HttpClient, I'll inject it)
    fetch(`${environment.apiUrl}/documentos/${doc.id}`, { method: 'DELETE' })
      .then(res => {
        if (res.ok) {
          difunto.documentos = difunto.documentos?.filter((d: any) => d.id !== doc.id);
          alert('Documento eliminado correctamente.');
        } else {
          alert('Error al eliminar el documento.');
        }
      })
      .catch(err => {
        console.error(err);
        alert('Ocurrió un error al intentar eliminar el documento.');
      });
  }
}
