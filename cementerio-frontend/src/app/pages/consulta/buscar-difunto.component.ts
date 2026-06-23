import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
                  <svg style="margin-right:4px; vertical-align: middle;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> <a href="javascript:void(0)" (click)="verDocumento(doc)" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">{{ doc.nombre }}</a>
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
          <button class="btn-ver-mas" (click)="verMas(res)">
            <svg style="margin-right: 4px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Ver Más
          </button>
        </div>

        <div class="no-results" *ngIf="resultados.length === 0">
          <p>No se encontraron resultados para "{{ query }}"</p>
        </div>
      </div>
    </div>

    <!-- Modal Ver Más -->
    <div class="modal-overlay" *ngIf="difuntoSeleccionado" (click)="cerrarModal()">
      <div class="modal-detail" (click)="$event.stopPropagation()">
        <div class="modal-detail-header" style="display:flex; justify-content:space-between; align-items:center; padding: 1.5rem 2rem 1rem; border-bottom: 2px solid #fce4f0;">
          <h2 style="margin:0; color:#d63384; font-size: 1.3rem;">Detalles del Difunto</h2>
          <button class="btn-close-modal" (click)="cerrarModal()" style="background:none; border:none; font-size: 1.2rem; cursor:pointer; color:#999; padding: 0.25rem 0.5rem; border-radius: 6px;">✕</button>
        </div>
        <div class="modal-body detalles-body" style="padding: 1.5rem 2rem;">
          <div class="detalle-item">
            <span class="label">Nombre Completo:</span>
            <span class="value">{{ difuntoSeleccionado.nombre }}</span>
          </div>
          <div class="detalle-item" *ngIf="difuntoSeleccionado.dui">
            <span class="label">DUI del Difunto:</span>
            <span class="value">{{ difuntoSeleccionado.dui }}</span>
          </div>
          <div class="detalle-item">
            <span class="label">Ubicación Exacta:</span>
            <span class="value"><svg style="margin-right:4px;" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> {{ difuntoSeleccionado.cementerioNombre || 'Cementerio' }} - {{ difuntoSeleccionado.ubicacion }}</span>
          </div>
          
          <div class="detalle-grid">
            <div class="detalle-item">
              <span class="label">Fecha Fallecimiento:</span>
              <span class="value">{{ difuntoSeleccionado.fechaFallecimiento || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <span class="label">Hora Fallecimiento:</span>
              <span class="value">{{ difuntoSeleccionado.horaFallecimiento || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <span class="label">Fecha Entierro:</span>
              <span class="value">{{ difuntoSeleccionado.fechaEntierro || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <span class="label">Hora Entierro:</span>
              <span class="value">{{ difuntoSeleccionado.horaEntierro || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <span class="label">Causa de Muerte:</span>
              <span class="value">{{ difuntoSeleccionado.causaMuerte || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <span class="label">Años Transcurridos:</span>
              <span class="value">{{ difuntoSeleccionado.anosTranscurridos }} años</span>
            </div>
          </div>

          <hr class="divider">
          <h3 style="margin-top: 1rem; margin-bottom: 0.5rem; color: #475569; font-size: 1rem;">Datos Personales</h3>
          <div class="detalle-grid">
            <div class="detalle-item">
              <span class="label">Fecha Nacimiento:</span>
              <span class="value">{{ difuntoSeleccionado.fechaNacimiento || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <span class="label">Edad:</span>
              <span class="value">{{ difuntoSeleccionado.edad ? difuntoSeleccionado.edad + ' años' : 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <span class="label">Sexo:</span>
              <span class="value">{{ difuntoSeleccionado.sexo || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <span class="label">Estado Civil:</span>
              <span class="value">{{ difuntoSeleccionado.estadoCivil || 'N/A' }}</span>
            </div>
            <div class="detalle-item" style="grid-column: span 2;">
              <span class="label">Domicilio del Fallecido:</span>
              <span class="value">{{ difuntoSeleccionado.domicilioFallecido || 'N/A' }}</span>
            </div>
          </div>

          <hr class="divider">
          <h3 style="margin-top: 1rem; margin-bottom: 0.5rem; color: #475569; font-size: 1rem;">Responsable</h3>
          <div class="detalle-grid">
            <div class="detalle-item">
              <span class="label">Nombre Responsable:</span>
              <span class="value">{{ difuntoSeleccionado.nombreResponsable || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <span class="label">Celular:</span>
              <span class="value">{{ difuntoSeleccionado.celularResponsable || 'N/A' }}</span>
            </div>
            <div class="detalle-item" style="grid-column: span 2;">
              <span class="label">Domicilio Responsable:</span>
              <span class="value">{{ difuntoSeleccionado.domicilioResponsable || 'N/A' }}</span>
            </div>
            <div class="detalle-item" style="grid-column: span 2;">
              <span class="label">Firmas Autorizadas:</span>
              <span class="value">{{ difuntoSeleccionado.firmasAutorizadas ? 'Sí' : 'No' }}</span>
            </div>
          </div>
          
          <hr class="divider" *ngIf="difuntoSeleccionado.tipoCementerio === 'Privado' || difuntoSeleccionado.tipoCementerio === 'Osario'">
          <h3 *ngIf="difuntoSeleccionado.tipoCementerio === 'Privado' || difuntoSeleccionado.tipoCementerio === 'Osario'" style="margin-top: 1rem; margin-bottom: 0.5rem; color: #475569; font-size: 1rem;">Placa y Material</h3>
          <div class="detalle-grid" *ngIf="difuntoSeleccionado.tipoCementerio === 'Privado' || difuntoSeleccionado.tipoCementerio === 'Osario'">
            <div class="detalle-item">
              <span class="label">Material Placa:</span>
              <span class="value">{{ difuntoSeleccionado.materialPlaca || 'N/A' }}</span>
            </div>
            <div class="detalle-item">
              <span class="label">Medidas Placa:</span>
              <span class="value">{{ difuntoSeleccionado.medidasPlaca || 'N/A' }}</span>
            </div>
          </div>

          <hr class="divider">

          <div class="detalle-item" *ngIf="difuntoSeleccionado.tipoCementerio !== 'Privado'">
            <div class="alerta-publico">
              <svg style="margin-right:4px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg> <strong>Espacio Público.</strong> Este es un espacio único para el público general, por lo que no ocupa compañeros.
            </div>
          </div>

          <div class="detalle-item" *ngIf="difuntoSeleccionado.tipoCementerio === 'Privado'">
            <span class="label">Propietario (Beneficio otorgado por):</span>
            <span class="value">{{ difuntoSeleccionado.dueno || 'Sin asignar' }} <span *ngIf="difuntoSeleccionado.duenoDui">({{ difuntoSeleccionado.duenoDui }})</span></span>
          </div>
          <div class="detalle-item" *ngIf="difuntoSeleccionado.tipoCementerio === 'Privado' && difuntoSeleccionado.beneficiarios?.length">
            <span class="label">Beneficiarios:</span>
            <ul class="value-list">
              <li *ngFor="let b of difuntoSeleccionado.beneficiarios">{{ b }}</li>
            </ul>
          </div>

          <div class="detalle-item" *ngIf="difuntoSeleccionado.documentos?.length">
            <span class="label">Documentos Adjuntos:</span>
            <ul class="value-list" style="list-style: none; padding: 0;">
              <li *ngFor="let doc of difuntoSeleccionado.documentos" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; background: #f8fafc; padding: 0.5rem; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div>
                  <svg style="margin-right:4px; vertical-align: middle;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> <a href="javascript:void(0)" (click)="verDocumento(doc)" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">{{ doc.nombre }}</a>
                </div>
                <button *ngIf="isAdmin" class="btn-close-modal" style="font-size: 1rem; color: #ef4444; background: none; border: none; cursor: pointer;" (click)="eliminarDocumento(doc, difuntoSeleccionado)" title="Eliminar documento">✕</button>
              </li>
            </ul>
          </div>

          <div class="detalle-item" *ngIf="difuntoSeleccionado.tipoCementerio === 'Privado' && difuntoSeleccionado.companerosCripta?.length">
            <span class="label">Ocupación de Cripta (Compañeros):</span>
            <div class="cripta-grid">
              <div class="cripta-slot" *ngFor="let comp of difuntoSeleccionado.companerosCripta" [class.ocupado]="comp.estado === 'OCUPADO'" [class.libre]="comp.estado !== 'OCUPADO'">
                <span class="slot-num">N° {{ comp.numero }}</span>
                <span class="slot-status">{{ comp.estado === 'OCUPADO' ? 'Ocupado' : 'Libre' }}</span>
                <span class="slot-name" *ngIf="comp.difuntoNombre" [title]="comp.difuntoNombre">{{ comp.difuntoNombre }}</span>
              </div>
            </div>
          </div>

          <div class="detalle-item">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span class="label" style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">Historial de Pagos
                <span class="status-badge" [class.success]="estadoPagoDetalle === 'Al Día'" [class.error]="estadoPagoDetalle !== 'Al Día'" style="padding: 0.3rem 0.6rem; border-radius: 8px; font-size: 0.75rem; font-weight: 800;">
                  {{ estadoPagoDetalle }}
                </span>
              </span>
            </div>
            
            <div *ngIf="!pagosCargados || pagosCargados.length === 0" style="text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 1rem 0; background: #f9fafb; border-radius: 8px; margin-top: 0.5rem;">
              No hay pagos registrados
            </div>

            <div *ngFor="let pago of pagosCargados" style="display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid #e5e7eb; padding: 0.8rem 1rem; border-radius: 8px; margin-top: 0.5rem;">
              <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                <strong style="color: #374151; font-size: 0.95rem;">{{ pago.concepto }}</strong>
                <span style="color: #6b7280; font-size: 0.8rem;">{{ pago.fecha }}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="font-family: monospace; font-weight: bold; color: #111827; font-size: 1.1rem;">$ {{ pago.monto }}</span>
                <span class="status-badge" [ngStyle]="{'background': pago.estado === 'PAGADO' ? '#dcfce7' : '#fee2e2', 'color': pago.estado === 'PAGADO' ? '#16a34a' : '#ef4444'}" style="padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800;">
                  {{ pago.estado }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-actions" style="display:flex; justify-content:flex-end; gap:1rem; padding: 1rem 2rem 1.5rem; border-top: 1px solid #f3e6ef;">
          <button style="background: #2c3e50; color: white; border: none; padding: 0.8rem 2rem; border-radius: 50px; font-weight: 700; cursor: pointer;" (click)="cerrarModal()">Cerrar</button>
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

    /* Detalles Modal (Copied from Difuntos) */
    .detalles-body { display:flex; flex-direction:column; gap:1.2rem; }
    .detalle-item { display:flex; flex-direction:column; gap:0.3rem; }
    .detalle-item .label { font-size:0.8rem; font-weight:700; color:#95a5a6; text-transform:uppercase; }
    .detalle-item .value { font-size:1rem; font-weight:600; color:#34495e; }
    .detalle-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; background:#f9fafb; padding:1rem; border-radius:12px; }
    .divider { border:none; border-top:1px solid #e5e7eb; margin:0.5rem 0; }
    .value-list { margin:0; padding-left:1.2rem; font-size:0.95rem; font-weight:600; color:#34495e; }
    .alerta-publico { background: #e0f2fe; border: 1px solid #bae6fd; color: #0369a1; padding: 1rem; border-radius: 8px; font-size: 0.9rem; margin-bottom: 1rem; }
    .status-badge.success { background: #dcfce7; color: #166534; }
    .status-badge.error { background: #fee2e2; color: #991b1b; }

    /* RESPONSIVE MÓVIL */
    @media (max-width: 768px) {
      .search-container { padding: 1rem; }
      .search-box { flex-direction: column; border-radius: 12px; padding: 1rem; }
      .search-box input { border-radius: 8px; padding: 0.8rem; text-align: center; }
      .btn-search { border-radius: 8px; padding: 0.8rem; width: 100%; }
      .hero-section h1 { font-size: 1.8rem; }
      .result-body { grid-template-columns: 1fr; }
      .cripta-grid { grid-template-columns: 1fr 1fr; }
      .modal-detail { width: 100%; height: 100%; max-height: 100vh; border-radius: 0; }
      .detail-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class BuscarDifuntoComponent implements OnInit {
  query = '';
  buscado = false;
  resultados: DifuntoDTO[] = [];
  cargando = false;
  difuntoSeleccionado: DifuntoDTO | null = null;
  isAdmin = false;
  
  // Pagos history
  pagosCargados: any[] = [];

  get estadoPagoDetalle(): string {
    if (!this.pagosCargados || this.pagosCargados.length === 0) return 'Sin Pagos';
    const tienePendiente = this.pagosCargados.some(p => p.estado === 'PENDIENTE');
    return tienePendiente ? 'Pendiente' : 'Al Día';
  }

  constructor(
    private difuntoService: DifuntoService,
    private http: HttpClient
  ) {}

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
    this.pagosCargados = [];
    this.http.get<any[]>(`${environment.apiUrl}/pagos/difunto/${d.id}`).subscribe(pagos => {
      this.pagosCargados = pagos;
    });
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
