import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DifuntoService, DifuntoDTO } from '../../services/difunto.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-difuntos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="header-section">
        <div class="title-group">
          <h1>Registro de Difuntos</h1>
          <p>Gestión y seguimiento de ocupantes del cementerio</p>
        </div>
        <button class="btn-primary" (click)="abrirModal()">
          <span class="icon">➕</span> Registrar Difunto
        </button>
      </div>

      <!-- Badge de cementerio para Operador -->
      <div class="cementerio-badge-top" *ngIf="!esAdmin && cementerioNombreUsuario">
        <span class="badge-icon">🏛️</span>
        <span>Operando en: <strong>{{ cementerioNombreUsuario }}</strong></span>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Total Difuntos</span>
          <span class="stat-value">{{ difuntos.length }}</span>
        </div>
        <div class="stat-card warning">
          <span class="stat-label">Pendientes de Pago</span>
          <span class="stat-value">{{ totalPendientes }}</span>
        </div>
        <div class="stat-card alert">
          <span class="stat-label">Requieren Renovación</span>
          <span class="stat-value">{{ totalRenovacion }}</span>
        </div>
      </div>

      <div class="card filters-card">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" placeholder="Buscar por nombre, DUI o ubicación..." [(ngModel)]="filtro">
        </div>
        <div class="filter-group">
          <select [(ngModel)]="filtroEstado">
            <option value="">Todos los estados</option>
            <option value="AL DÍA">Al Día</option>
            <option value="PENDIENTE">Pendiente</option>
          </select>
        </div>
      </div>

      <div class="table-container card">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Difunto</th>
              <th>DUI</th>
              <th>Nacimiento</th>
              <th>Fallecimiento</th>
              <th>Entierro</th>
              <th>Ubicación</th>
              <th>Propietario / Beneficiarios</th>
              <th>Estado Pago</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of difuntosFiltrados">
              <td>
                <div class="difunto-info">
                  <span class="name">{{ d.nombre }}</span>
                </div>
              </td>
              <td>
                <span class="date">{{ d.dui || '—' }}</span>
              </td>
              <td>
                <span class="date">{{ d.fechaNacimiento || 'N/A' }}</span>
              </td>
              <td>
                <div class="date-info">
                  <span class="date">{{ d.fechaFallecimiento }}</span>
                  <span class="elapsed" [class.alert]="d.requiereRenovacion">
                    {{ d.anosTranscurridos }} años transcurridos
                  </span>
                </div>
              </td>
              <td>
                <span class="date">{{ d.fechaEntierro || 'N/A' }}</span>
              </td>
              <td>
                <div class="location-info">
                  <span class="location-chip">📍 {{ d.cementerioNombre || 'Cementerio' }}</span>
                  <div style="font-size: 0.8rem; margin-top: 6px; color: var(--text-muted); white-space: normal; line-height: 1.2;">{{ d.ubicacion }}</div>
                  <div style="margin-top: 6px;">
                    <span class="tipo-badge" [class.privado]="d.tipoCementerio === 'Privado'" [class.publico]="d.tipoCementerio !== 'Privado'">
                      {{ d.tipoCementerio === 'Privado' ? 'PRIVADO' : 'PÚBLICO' }}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <div class="owner-info">
                  <span class="owner-name">{{ d.dueno }} <span *ngIf="d.duenoDui" style="font-size: 0.8em; color: var(--text-muted);">({{ d.duenoDui }})</span></span>
                  <div class="beneficiaries" *ngIf="d.beneficiarios && d.beneficiarios.length > 0">
                    <small>Beneficiarios: {{ (d.beneficiarios || []).join(', ') }}</small>
                  </div>
                </div>
              </td>
              <td>
                <span class="status-badge" [class.success]="d.estadoPago === 'AL DÍA'" [class.error]="d.estadoPago === 'PENDIENTE'">
                  {{ d.estadoPago }}
                </span>
              </td>
              <td>
                <div class="actions">
                  <button class="btn-action view" title="Ver Detalle" (click)="verDetalles(d)">👁️</button>
                  <button class="btn-action edit" title="Editar Difunto" (click)="editar(d)">✏️</button>
                  <button class="btn-action delete" title="Eliminar Difunto" (click)="eliminar(d)">🗑️</button>
                  <button class="btn-action renew" *ngIf="d.requiereRenovacion" title="Renovar Contrato">🔄</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal de Registro -->
      <div class="modal-overlay" *ngIf="showModal">
        <div class="modal-content modal-lg">
          <div class="modal-header">
            <h2>{{ modoEdicion ? 'Editar Difunto' : 'Registrar Difunto' }}</h2>
            <button class="btn-close-modal" (click)="cerrarModal()">✕</button>
          </div>

          <!-- Datos del difunto -->
          <div class="modal-body form-sections-container">
            
            <h3 class="section-title">Datos Personales del Difunto</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Nombre completo *</label>
                <input type="text" [(ngModel)]="nuevoDifunto.nombre" placeholder="Nombre del difunto">
              </div>
              <div class="form-group">
                <label>DUI</label>
                <input type="text" [(ngModel)]="nuevoDifunto.dui" (input)="onDuiInput($event)" maxlength="10" placeholder="Ej: 01234567-8" [disabled]="modoEdicion">
              </div>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label>Edad</label>
                <input type="number" [(ngModel)]="nuevoDifunto.edad" placeholder="Edad">
              </div>
              <div class="form-group">
                <label>Sexo</label>
                <select [(ngModel)]="nuevoDifunto.sexo">
                  <option value="">Seleccione</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                </select>
              </div>
              <div class="form-group">
                <label>Estado Civil</label>
                <input type="text" [(ngModel)]="nuevoDifunto.estadoCivil" placeholder="Ej: Soltero, Casado">
              </div>
            </div>
            <div class="form-group">
              <label>Domicilio del Fallecido</label>
              <input type="text" [(ngModel)]="nuevoDifunto.domicilioFallecido" placeholder="Dirección completa">
            </div>

            <h3 class="section-title">Datos Médicos y Fallecimiento</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Fecha de Fallecimiento *</label>
                <input type="date" [(ngModel)]="nuevoDifunto.fechaFallecimiento">
              </div>
              <div class="form-group">
                <label>Hora de Fallecimiento</label>
                <input type="time" [(ngModel)]="nuevoDifunto.horaFallecimiento">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Causa de la muerte</label>
                <input type="text" [(ngModel)]="nuevoDifunto.causaMuerte" placeholder="Causa según dictamen médico">
              </div>
              <div class="form-group">
                <label>Fecha de Nacimiento</label>
                <input type="date" [(ngModel)]="nuevoDifunto.fechaNacimiento">
              </div>
            </div>

            <h3 class="section-title">Datos del Responsable</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Nombre del Responsable</label>
                <input type="text" [(ngModel)]="nuevoDifunto.nombreResponsable" placeholder="Responsable del entierro">
              </div>
              <div class="form-group">
                <label>Celular</label>
                <input type="text" [(ngModel)]="nuevoDifunto.celularResponsable" placeholder="Teléfono de contacto">
              </div>
            </div>
            <div class="form-group">
              <label>Domicilio del Responsable</label>
              <input type="text" [(ngModel)]="nuevoDifunto.domicilioResponsable" placeholder="Dirección del responsable">
            </div>
            <div class="checkbox-group">
              <label>
                <input type="checkbox" [(ngModel)]="nuevoDifunto.firmasAutorizadas"> 
                Confirmo que el Administrador y el Responsable han firmado la boleta física.
              </label>
            </div>

            <h3 class="section-title">Ubicación e Inhumación</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label>Fecha de Entierro</label>
                <input type="date" [(ngModel)]="nuevoDifunto.fechaEntierro">
              </div>
              <div class="form-group">
                <label>Hora de Entierro</label>
                <input type="time" [(ngModel)]="nuevoDifunto.horaEntierro">
              </div>
            </div>
            
            <!-- Selector Tipo de Inhumación -->
            <div class="form-group custom-tipo-selector" *ngIf="!modoEdicion">
              <label>Tipo de Inhumación (Sector)</label>
              <div class="tipo-buttons">
                <button [class.active]="tipoInhumacionUI === 'cripta'" (click)="setTipoInhumacion('cripta')" type="button">Lote / Fosa (Criptas)</button>
                <button [class.active]="tipoInhumacionUI === 'osario'" (click)="setTipoInhumacion('osario')" type="button">Sector Osarios</button>
              </div>
            </div>

            <!-- ESPACIOS CRIPTA / FOSA -->
            <ng-container *ngIf="!modoEdicion && tipoInhumacionUI === 'cripta'">
              <div class="form-group" *ngIf="esAdmin">
                <label>Cementerio *</label>
                <select [(ngModel)]="cementerioSeleccionadoId" (ngModelChange)="onCementerioChange($event)">
                  <option [ngValue]="null">-- Seleccione un cementerio --</option>
                  <option *ngFor="let c of cementerios" [ngValue]="c.id">{{ c.nombre }}</option>
                </select>
              </div>

              <div class="cementerio-badge" *ngIf="!esAdmin && cementerioNombreUsuario" style="margin-bottom: 1.5rem; display: inline-flex; align-items: center; gap: 0.5rem; background: #fff0f6; border: 1px solid #f3c2d9; border-radius: 8px; padding: 0.75rem 1rem; color: #d63384; font-size: 0.95rem; font-weight: 500;">
                <span class="badge-icon" style="font-size: 1.2rem;">🏛️</span>
                <span>Registrando en: <strong>{{ cementerioNombreUsuario }}</strong></span>
              </div>

              <div class="espacios-section" *ngIf="cementerioSeleccionadoId">
                <div class="loading-espacios" *ngIf="cargandoEspacios">⏳ Cargando estructura...</div>
                <ng-container *ngIf="!cargandoEspacios">
                  <div class="privado-badge" *ngIf="cementerioEsPrivado">
                    🔒 <strong>Jardín (Privado)</strong> — Verificaremos que el propietario esté al día.
                  </div>
                  <div class="form-group" *ngIf="parcelasUnicas.length > 0">
                    <label>Parcela *</label>
                    <select [(ngModel)]="parcelaSeleccionada" (ngModelChange)="onParcelaChange()">
                      <option value="">-- Seleccione una parcela --</option>
                      <option *ngFor="let p of parcelasUnicas" [value]="p.key">{{ p.label }}</option>
                    </select>
                  </div>
                  
                  <div *ngIf="parcelaSeleccionada">
                    <div class="espacios-header">
                      <label>Espacios en "{{ parcelaSeleccionada }}"</label>
                      <div class="leyenda">
                        <span class="leg libre">■ Libre</span>
                        <span class="leg ocupado">■ Ocupado</span>
                      </div>
                    </div>
                    <div class="espacios-grid">
                      <div *ngFor="let esp of espaciosFiltrados" class="espacio-btn" [class.libre]="!esp.ocupado" [class.ocupado]="esp.ocupado" [class.seleccionado]="nuevoDifunto.espacioId === esp.id" (click)="!esp.ocupado && seleccionarEspacio(esp)">
                        <span class="espacio-num">E{{ esp.numero }}</span>
                        <span class="espacio-lote">{{ esp.lote }}</span>
                        <span class="espacio-difunto" *ngIf="esp.ocupado">{{ esp.difunto | slice:0:8 }}…</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="espacio-seleccionado-info" *ngIf="nuevoDifunto.espacioId && espacioSeleccionadoLabel">
                    📍 <strong>Espacio seleccionado:</strong> {{ espacioSeleccionadoLabel }}
                  </div>
                  
                  <!-- VALIDACIONES FÍSICAS CRIPTA -->
                  <div class="validaciones-caja" *ngIf="nuevoDifunto.espacioId">
                    <ng-container *ngIf="cementerioEsPrivado">
                      <div class="alerta-privado">
                        <strong>⚠️ Regla Cementerio Jardín:</strong> La placa identificativa debe ser estrictamente de material "Base de hierro con letras de bronce" y medir "40x20 cm".
                      </div>
                      <div class="form-row">
                        <div class="form-group">
                          <label>Material Placa</label>
                          <input type="text" [(ngModel)]="nuevoDifunto.materialPlaca" placeholder="Base de hierro con letras de bronce">
                        </div>
                        <div class="form-group">
                          <label>Medidas Placa</label>
                          <input type="text" [(ngModel)]="nuevoDifunto.medidasPlaca" placeholder="40x20 cm">
                        </div>
                      </div>
                    </ng-container>
                    
                    <ng-container *ngIf="!cementerioEsPrivado">
                      <div class="alerta-publico">
                        <strong>⚠️ Regla Cementerio General:</strong> Está prohibida la construcción de bóvedas de cemento. Confirme la colocación de Cruz tradicional.
                      </div>
                      <div class="checkbox-group">
                        <label>
                          <input type="checkbox" [(ngModel)]="nuevoDifunto.cruzNombreYFecha"> 
                          Se colocará Cruz con Nombre y Fecha del difunto.
                        </label>
                      </div>
                    </ng-container>
                  </div>
                </ng-container>
              </div>
            </ng-container>

            <!-- ESPACIOS OSARIO -->
            <ng-container *ngIf="!modoEdicion && tipoInhumacionUI === 'osario'">
              <div class="alerta-privado">
                <strong>⚠️ Sector Osarios:</strong> Digite el ID del Osario (temporal) y complete la validación de la placa (Aluminio 25x10 cm).
              </div>
              <div class="form-group">
                <label>ID del Osario *</label>
                <input type="number" [(ngModel)]="nuevoDifunto.osarioId" placeholder="ID del osario">
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Material Placa</label>
                  <input type="text" [(ngModel)]="nuevoDifunto.materialPlaca" placeholder="Aluminio">
                </div>
                <div class="form-group">
                  <label>Medidas Placa</label>
                  <input type="text" [(ngModel)]="nuevoDifunto.medidasPlaca" placeholder="25x10 cm">
                </div>
              </div>
            </ng-container>

            <h3 class="section-title" style="margin-top: 1.5rem;">Documentación Adjunta</h3>
            <!-- Área de carga de documentos -->
            <div class="form-group">
              <label>Boleta, DICTAMEN o Certificados (PDF/Word) *</label>
              <input type="file" (change)="onFileSelected($event)" multiple accept=".pdf,.doc,.docx" class="form-control"/>
              <ul class="uploaded-files" *ngIf="nuevoDifunto.documentos.length">
                <li *ngFor="let doc of nuevoDifunto.documentos; let i = index">
                  📄 {{ doc.nombre }} <span class="btn-remove-doc" (click)="nuevoDifunto.documentos.splice(i, 1)">✕</span>
                </li>
              </ul>
            </div>

          </div>

          <div class="modal-actions">
            <button class="btn-cancel" (click)="cerrarModal()">Cancelar</button>
            <button class="btn-primary" (click)="guardarDifunto()">
              {{ modoEdicion ? 'Actualizar' : 'Registrar' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de Detalles del Difunto -->
      <div class="modal-overlay" *ngIf="showModalDetalles && difuntoSeleccionado">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Detalles del Difunto</h2>
            <button class="btn-close-modal" (click)="cerrarModalDetalles()">✕</button>
          </div>
          <div class="modal-body detalles-body">
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
              <span class="value">📍 {{ difuntoSeleccionado.cementerioNombre || 'Cementerio' }} - {{ difuntoSeleccionado.ubicacion }}</span>
            </div>
            
            <div class="detalle-grid">
              <div class="detalle-item">
                <span class="label">Fecha Fallecimiento:</span>
                <span class="value">{{ difuntoSeleccionado.fechaFallecimiento || 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Fecha Nacimiento:</span>
                <span class="value">{{ difuntoSeleccionado.fechaNacimiento || 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Fecha Entierro:</span>
                <span class="value">{{ difuntoSeleccionado.fechaEntierro || 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Años Transcurridos:</span>
                <span class="value">{{ difuntoSeleccionado.anosTranscurridos }} años</span>
              </div>
            </div>

            <hr class="divider">

            <div class="detalle-item" *ngIf="difuntoSeleccionado.tipoCementerio !== 'Privado'">
              <div class="alerta-publico">
                <strong>ℹ️ Espacio Público.</strong> Este es un espacio único para el público general, por lo que no ocupa compañeros.
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
              <ul class="value-list">
                <li *ngFor="let doc of difuntoSeleccionado.documentos">
                  📄 <a href="javascript:void(0)" (click)="verDocumento(doc)" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">{{ doc.nombre }}</a>
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
              <span class="label">Estado de Pago:</span>
              <span class="status-badge" [class.success]="difuntoSeleccionado.estadoPago === 'AL DÍA'" [class.error]="difuntoSeleccionado.estadoPago === 'PENDIENTE'">
                {{ difuntoSeleccionado.estadoPago }}
              </span>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn-primary" (click)="cerrarModalDetalles()">Cerrar</button>
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
          <div class="modal-actions" style="justify-content: center;">
            <button class="btn-cancel" *ngIf="alertaModal.tipo === 'confirmar'" (click)="cerrarAlertaModal()">Cancelar</button>
            <button class="btn-primary" (click)="confirmarAlertaModal()">Aceptar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .title-group h1 {
      margin: 0;
      color: var(--primary-color);
      font-size: 2rem;
    }

    .title-group p {
      margin: 0.5rem 0 0;
      color: var(--text-muted);
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;
      border: none;
      padding: 0.8rem 1.5rem;
      border-radius: 12px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
      box-shadow: 0 4px 15px rgba(215, 51, 135, 0.2);
    }

    .btn-primary:hover {
      background: var(--primary-hover);
      transform: translateY(-2px);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--card-bg);
      padding: 1.5rem;
      border-radius: 16px;
      border: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .stat-label { color: var(--text-muted); font-size: 0.9rem; font-weight: 600; }
    .stat-value { color: var(--text-main); font-size: 1.8rem; font-weight: 800; }
    .stat-card.warning { border-left: 4px solid #f59e0b; }
    .stat-card.alert { border-left: 4px solid #ef4444; }

    .filters-card {
      display: flex;
      gap: 1.5rem;
      padding: 1.2rem;
      margin-bottom: 1.5rem;
      align-items: center;
    }

    .search-box {
      flex: 1;
      display: flex;
      align-items: center;
      background: var(--bg-color);
      padding: 0.6rem 1rem;
      border-radius: 10px;
      border: 1px solid var(--border-color);
    }

    .search-box input {
      border: none;
      background: transparent;
      margin-left: 0.5rem;
      width: 100%;
      outline: none;
      color: var(--text-main);
    }

    .table-container {
      overflow-x: auto;
      white-space: nowrap;
    }
    
    .modern-table {
      width: 100%;
      border-collapse: collapse;
    }

    .modern-table th {
      text-align: left;
      padding: 1.2rem;
      background: var(--bg-color);
      color: var(--text-muted);
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .modern-table td {
      padding: 1.2rem;
      border-bottom: 1px solid var(--border-color);
      vertical-align: middle;
    }

    .difunto-info { display: flex; flex-direction: column; }
    .difunto-info .name { font-weight: 700; color: var(--text-main); }
    .difunto-info .id-tag { font-size: 0.75rem; color: var(--text-muted); }

    .date-info { display: flex; flex-direction: column; }
    .date-info .elapsed { font-size: 0.85rem; font-weight: 600; }
    .date-info .elapsed.alert { color: #ef4444; }

    .location-chip {
      background: rgba(215, 51, 135, 0.1);
      color: var(--primary-color);
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .status-badge {
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
    }

    .status-badge.success { background: #dcfce7; color: #166534; }
    .status-badge.error { background: #fee2e2; color: #991b1b; }
    
    .tipo-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .tipo-badge.privado { background: #fef08a; color: #854d0e; border: 1px solid #fde047; }
    .tipo-badge.publico { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }

    .actions { display: flex; gap: 0.5rem; }
    .btn-action {
      border: 1px solid var(--border-color);
      background: var(--card-bg);
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-action:hover { background: var(--bg-color); transform: scale(1.1); }
    .btn-action.edit:hover { background: #e0f2fe; border-color: #0ea5e9; }
    .btn-action.delete:hover { background: #fee2e2; border-color: #ef4444; }
    .btn-action.renew { border-color: #ef4444; color: #ef4444; }

    /* Modal Styles */
    .modal-overlay { position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.55); display:flex; justify-content:center; align-items:center; z-index: 100; backdrop-filter: blur(4px); padding: 1rem; }
    .modal-content { background:white; border-radius:16px; width:500px; max-height:90vh; overflow-y:auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .modal-lg { width: 720px; }
    .modal-header { display:flex; justify-content:space-between; align-items:center; padding: 1.5rem 2rem 1rem; border-bottom: 2px solid #fce4f0; }
    .modal-header h2 { margin:0; color:#d63384; font-size: 1.3rem; }
    .btn-close-modal { background:none; border:none; font-size: 1.2rem; cursor:pointer; color:#999; padding: 0.25rem 0.5rem; border-radius: 6px; }
    .btn-close-modal:hover { background: #fee2e2; color: #d63384; }
    .modal-body { padding: 1.5rem 2rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display:block; font-size:0.85rem; font-weight:700; margin-bottom:0.5rem; color:#374151; }
    .form-group input, .form-group select { width:100%; padding:0.8rem; border:1.5px solid #e5e7eb; border-radius:8px; font-size: 0.95rem; transition: border-color 0.2s; box-sizing: border-box; }
    .form-group input:focus, .form-group select:focus { outline:none; border-color:#d63384; box-shadow: 0 0 0 3px rgba(214,51,132,0.12); }
    .modal-actions { display:flex; justify-content:flex-end; gap:1rem; padding: 1rem 2rem 1.5rem; border-top: 1px solid #f3e6ef; }
    .btn-cancel { padding:0.8rem 1.5rem; border:1px solid #e5e7eb; background:#f9fafb; border-radius:8px; cursor:pointer; font-weight:600; }

    /* Cementerio badge */
    .cementerio-badge { display:flex; align-items:center; gap:0.5rem; background:#fff0f6; border:1px solid #f3c2d9; border-radius:10px; padding:0.75rem 1rem; margin-bottom:1rem; color:#d63384; font-size:0.9rem; }
    .badge-icon { font-size: 1.2rem; }

    /* Espacios grid */
    .espacios-section { margin-top: 1rem; border-top: 1px solid #f3e6ef; padding-top: 1rem; }
    .espacios-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.75rem; }
    .espacios-header label { font-size:0.85rem; font-weight:700; color:#374151; }
    .leyenda { display:flex; gap:1rem; font-size:0.8rem; font-weight:600; }
    .leg.libre { color:#16a34a; }
    .leg.ocupado { color:#dc2626; }
    .loading-espacios { text-align:center; padding:1rem; color:#9ca3af; font-style:italic; }
    .espacios-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(90px,1fr)); gap:0.5rem; max-height:220px; overflow-y:auto; padding:0.5rem; border:1px solid #e5e7eb; border-radius:10px; }
    .espacio-btn { border-radius:8px; padding:0.5rem 0.3rem; text-align:center; cursor:pointer; transition:all 0.15s; display:flex; flex-direction:column; gap:2px; border:2px solid transparent; }
    .espacio-btn.libre { background:#f0fdf4; border-color:#86efac; }
    .espacio-btn.libre:hover { background:#dcfce7; border-color:#16a34a; transform:scale(1.05); }
    .espacio-btn.ocupado { background:#fef2f2; border-color:#fca5a5; cursor:not-allowed; opacity:0.75; }
    .espacio-btn.seleccionado { background:#d63384 !important; border-color:#d63384 !important; color:white !important; transform:scale(1.08); box-shadow: 0 4px 12px rgba(214,51,132,0.4); }
    .espacio-num { font-weight:800; font-size:0.85rem; }
    .espacio-parcela { font-size:0.65rem; color:inherit; opacity:0.8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .espacio-lote { font-size:0.6rem; color:#dc2626; }
    .espacio-seleccionado-info { margin-top:0.75rem; padding:0.6rem 1rem; background:#fff0f6; border-radius:8px; font-size:0.85rem; color:#d63384; font-weight:600; }
    .empty-espacios { text-align:center; color:#9ca3af; padding:1rem; font-style:italic; }
    .privado-badge { background:#fef9c3; border:1px solid #fde047; border-radius:10px; padding:0.6rem 1rem; margin-bottom:1rem; font-size:0.85rem; color:#854d0e; }
    .espacio-difunto { font-size:0.6rem; color:#dc2626; }
    
    /* Detalles Modal */
    .detalles-body { display:flex; flex-direction:column; gap:1.2rem; }
    .detalle-item { display:flex; flex-direction:column; gap:0.3rem; }
    .detalle-item .label { font-size:0.8rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; }
    .detalle-item .value { font-size:1rem; font-weight:600; color:var(--text-main); }
    .detalle-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; background:#f9fafb; padding:1rem; border-radius:12px; }
    .divider { border:none; border-top:1px solid #e5e7eb; margin:0.5rem 0; }
    .value-list { margin:0; padding-left:1.2rem; font-size:0.95rem; font-weight:600; color:var(--text-main); }
    .uploaded-files { list-style:none; padding:0; margin-top:0.5rem; }
    .uploaded-files li { background:#f3f4f6; padding:0.5rem 0.8rem; border-radius:6px; font-size:0.85rem; margin-bottom:0.3rem; display:flex; align-items:center; gap:0.5rem; font-weight:600; }
    
    /* Cripta Grid */
    .cripta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-top: 0.5rem; }
    .cripta-slot { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.5rem; text-align: center; display: flex; flex-direction: column; gap: 4px; }
    .cripta-slot.ocupado { background: #fee2e2; border-color: #fca5a5; }
    .cripta-slot.libre { background: #f0fdf4; border-color: #86efac; }
    .slot-num { font-size: 0.75rem; font-weight: 700; color: #6b7280; }
    .slot-status { font-size: 0.7rem; text-transform: uppercase; font-weight: 800; }
    .cripta-slot.ocupado .slot-status { color: #dc2626; }
    .cripta-slot.libre .slot-status { color: #16a34a; }
    .slot-name { font-size: 0.75rem; font-weight: 600; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .alerta-publico { background: #e0f2fe; border: 1px solid #bae6fd; color: #0369a1; padding: 1rem; border-radius: 8px; font-size: 0.9rem; margin-bottom: 1rem; }
    .alerta-privado { background: #fef9c3; border: 1px solid #fde047; color: #854d0e; padding: 1rem; border-radius: 8px; font-size: 0.9rem; margin-bottom: 1rem; }
    
    /* Nuevos Estilos Formulario Ordenado */
    .form-sections-container { max-height: 75vh; overflow-y: auto; padding-right: 10px; }
    .section-title { font-size: 1.1rem; color: #d63384; border-bottom: 2px solid #fce4f0; padding-bottom: 0.5rem; margin-top: 2rem; margin-bottom: 1rem; font-weight: 800; }
    .section-title:first-child { margin-top: 0; }
    .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
    .checkbox-group { margin: 1rem 0; padding: 1rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
    .checkbox-group label { display: flex; align-items: center; gap: 0.8rem; font-size: 0.9rem; font-weight: 600; color: #374151; cursor: pointer; margin: 0; }
    .checkbox-group input[type="checkbox"] { width: 1.2rem; height: 1.2rem; cursor: pointer; accent-color: #d63384; }
    .btn-remove-doc { color: #ef4444; cursor: pointer; font-weight: bold; margin-left: auto; padding: 2px 8px; border-radius: 4px; }
    .btn-remove-doc:hover { background: #fee2e2; }
    
    .cementerio-badge-top { display:inline-flex; align-items:center; gap:0.5rem; background:#fff0f6; border:1px solid #f3c2d9; border-radius:10px; padding:0.75rem 1rem; margin-bottom:1.5rem; color:#d63384; font-size:1rem; font-weight:700; box-shadow: 0 4px 6px rgba(214,51,132,0.1); }
    
    /* Selector Tipo Inhumación */
    .custom-tipo-selector { margin-bottom: 1.5rem; }
    .tipo-buttons { display: flex; gap: 1rem; }
    .tipo-buttons button { flex: 1; padding: 1rem; background: #fff; border: 2px solid #f3e6ef; border-radius: 12px; font-weight: 700; color: #6b7280; cursor: pointer; transition: all 0.2s; }
    .tipo-buttons button:hover { border-color: #fce4f0; background: #fff0f6; }
    .tipo-buttons button.active { background: #d63384; color: white; border-color: #d63384; box-shadow: 0 4px 12px rgba(214, 51, 132, 0.3); transform: translateY(-2px); }
    .validaciones-caja { margin-top: 1rem; padding: 1rem; border: 2px dashed #fce4f0; border-radius: 12px; background: #fffafc; }
  `]
})
export class DifuntosComponent implements OnInit {
  difuntos: DifuntoDTO[] = [];
  filtro = '';
  filtroEstado = '';

  // Permisos y cementerio
  esAdmin = false;
  cementerioNombreUsuario: string | null = null;
  cementerioIdUsuario: number | null = null;

  // Modal de Registro/Edición
  showModal = false;
  modoEdicion = false;
  difuntoActualId: number | null = null;

  // Modal de Detalles
  showModalDetalles = false;
  difuntoSeleccionado: any = null;

  // Lista de cementerios (solo para ADMIN)
  cementerios: any[] = [];
  cementerioSeleccionadoId: number | null = null;
  cementerioEsPrivado = false;
  tipoInhumacionUI: 'cripta' | 'osario' = 'cripta';

  // Espacios
  espacios: any[] = [];
  cargandoEspacios = false;
  espacioSeleccionadoLabel = '';

  // Parcelas y filtrado
  parcelasUnicas: any[] = [];
  espaciosFiltrados: any[] = [];
  parcelaSeleccionada = '';

  nuevoDifunto: DifuntoDTO & { documentos: any[] } = {
    id: 0,
    nombre: '',
    dui: '',
    fechaFallecimiento: '',
    fechaNacimiento: '',
    fechaEntierro: '',
    anosTranscurridos: 0,
    ubicacion: '',
    cementerioNombre: '',
    tipoCementerio: '',
    estadoPago: '',
    dueno: '',
    duenoDui: '',
    requiereRenovacion: false,
    espacioId: null as any,
    osarioId: null as any,
    documentos: [],
    
    // Legal fields
    correlativo: '',
    edad: null as any,
    sexo: '',
    estadoCivil: '',
    causaMuerte: '',
    domicilioFallecido: '',
    nombreResponsable: '',
    domicilioResponsable: '',
    celularResponsable: '',
    horaFallecimiento: '',
    horaEntierro: '',
    firmasAutorizadas: false,
    
    // Validations
    cruzNombreYFecha: false,
    materialPlaca: '',
    medidasPlaca: ''
  };

  alertaModal = {
    visible: false,
    tipo: '' as 'error' | 'exito' | 'confirmar',
    titulo: '',
    mensaje: '',
    confirmarCallback: null as (() => void) | null
  };

  constructor(
    private difuntoService: DifuntoService,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.verificarPermisos();
    this.cargarCementerios();
    this.cargarDifuntos();
  }

  verificarPermisos() {
    const rol = this.authService.getUserRole()?.toUpperCase();
    this.esAdmin = rol === 'ADMIN' || rol === 'ADMINISTRADOR';
    this.cementerioIdUsuario = this.authService.getCementerioId();
    this.cementerioNombreUsuario = this.authService.getCementerioNombre();
  }

  cargarCementerios() {
    if (this.esAdmin) {
      this.http.get<any[]>('http://localhost:8081/api/cementerios').subscribe(data => {
        this.cementerios = data;
      });
    } else if (this.cementerioIdUsuario) {
      this.http.get<any>(`http://localhost:8081/api/cementerios/${this.cementerioIdUsuario}`).subscribe(cem => {
        this.cementerioEsPrivado = cem.tienePrivado || false;
      });
    }
  }

  cargarDifuntos() {
    this.difuntoService.getDifuntos().subscribe(data => {
      if (this.esAdmin) {
        this.difuntos = data;
      } else {
        this.difuntos = data.filter(d => d.cementerioNombre === this.cementerioNombreUsuario);
      }
    });
  }

  get difuntosFiltrados() {
    return this.difuntos.filter(d => {
      const matchText = d.nombre.toLowerCase().includes(this.filtro.toLowerCase()) ||
                       (d.dui && d.dui.toLowerCase().includes(this.filtro.toLowerCase())) ||
                       d.ubicacion.toLowerCase().includes(this.filtro.toLowerCase());
      const matchEstado = this.filtroEstado ? d.estadoPago === this.filtroEstado : true;
      return matchText && matchEstado;
    });
  }

  get totalPendientes() {
    return this.difuntos.filter(d => d.estadoPago === 'PENDIENTE').length;
  }

  get totalRenovacion() {
    return this.difuntos.filter(d => d.requiereRenovacion).length;
  }

  abrirModal() {
    this.showModal = true;
    this.modoEdicion = false;
    this.espacios = [];
    this.espacioSeleccionadoLabel = '';
    this.nuevoDifunto = {
      id: 0, nombre: '', dui: '', fechaFallecimiento: '', fechaNacimiento: '', fechaEntierro: '', 
      anosTranscurridos: 0, ubicacion: '', cementerioNombre: '', tipoCementerio: '', estadoPago: '',
      dueno: '', duenoDui: '', requiereRenovacion: false, espacioId: null as any, osarioId: null as any,
      documentos: [], correlativo: '', edad: null as any, sexo: '', estadoCivil: '', causaMuerte: '',
      domicilioFallecido: '', nombreResponsable: '', domicilioResponsable: '', celularResponsable: '',
      horaFallecimiento: '', horaEntierro: '', firmasAutorizadas: false, cruzNombreYFecha: false,
      materialPlaca: '', medidasPlaca: ''
    };

    // Si el usuario ya tiene cementerio asignado (no es admin), cargarlo automáticamente
    if (!this.esAdmin && this.cementerioIdUsuario) {
      this.cementerioSeleccionadoId = this.cementerioIdUsuario;
      this.cargarEspacios(this.cementerioIdUsuario);
    } else {
      this.cementerioSeleccionadoId = null;
    }
  }

  cerrarModal() {
    this.showModal = false;
  }

  onCementerioChange(cemId: number | null) {
    this.parcelasUnicas = [];
    this.espaciosFiltrados = [];
    this.parcelaSeleccionada = '';
    this.espacios = [];
    this.nuevoDifunto.espacioId = null as any;
    this.espacioSeleccionadoLabel = '';
    if (cemId) {
      this.cargarEspacios(cemId);
    } else {
      this.cementerioEsPrivado = false;
    }
  }

  // --- DUI Mask ---
  onDuiInput(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 9) val = val.substring(0, 9);
    if (val.length > 8) {
      val = val.substring(0, 8) + '-' + val.substring(8);
    }
    this.nuevoDifunto.dui = val;
    event.target.value = val;
  }

  setTipoInhumacion(tipo: 'cripta' | 'osario') {
    this.tipoInhumacionUI = tipo;
    // Reset selections
    this.nuevoDifunto.espacioId = null as any;
    this.nuevoDifunto.osarioId = null as any;
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

  onParcelaChange() {
    if (this.parcelaSeleccionada) {
      this.espaciosFiltrados = this.espacios.filter(e => e.parcela?.toString() === this.parcelaSeleccionada);
      const obj = this.parcelasUnicas.find(p => p.key === this.parcelaSeleccionada);
      if (obj) {
        this.cementerioEsPrivado = obj.seccion === 'PRIVADO';
      }
    } else {
      this.espaciosFiltrados = [];
      this.cementerioEsPrivado = false;
    }
  }
  cargarEspacios(cementerioId: number) {
    this.cargandoEspacios = true;
    this.http.get<any[]>(`http://localhost:8081/api/espacios/por-cementerio/${cementerioId}`).subscribe({
      next: (data) => {
        this.espacios = data;
        // Compute distinct parcelas with section
        const parcelaMap = new Map<string, {key: string, label: string, seccion: string}>();
        data.forEach(esp => {
          const key = esp.parcela?.toString() || '';
          const seccionRaw = esp.seccion?.toString() || '';
          if (key && !parcelaMap.has(key)) {
            const secLabel = seccionRaw.toLowerCase().includes('privado') ? 'PRIVADO' : 'PÚBLICO';
            parcelaMap.set(key, {key, label: `Parcela ${key} (${secLabel})`, seccion: secLabel});
          }
        });
        this.parcelasUnicas = Array.from(parcelaMap.values());
        // Reset selection
        this.parcelaSeleccionada = '';
        this.espaciosFiltrados = [];
        this.cargandoEspacios = false;
      },
      error: () => { this.cargandoEspacios = false; }
    });
  }

  seleccionarEspacio(esp: any) {
    this.nuevoDifunto.espacioId = esp.id;
    this.espacioSeleccionadoLabel = esp.label;
  }

  editar(d: DifuntoDTO) {
    this.showModal = true;
    this.modoEdicion = true;
    this.difuntoActualId = d.id;
    this.espacios = [];
    this.cementerioSeleccionadoId = null;
    this.nuevoDifunto = {
      ...d,
      espacioId: null as any,
      osarioId: null as any,
      documentos: d.documentos ? [...(d.documentos as any[])] : [],
      horaFallecimiento: d.horaFallecimiento || '',
      horaEntierro: d.horaEntierro || '',
      correlativo: d.correlativo || '',
      edad: d.edad || null as any,
      sexo: d.sexo || '',
      estadoCivil: d.estadoCivil || '',
      causaMuerte: d.causaMuerte || '',
      domicilioFallecido: d.domicilioFallecido || '',
      nombreResponsable: d.nombreResponsable || '',
      domicilioResponsable: d.domicilioResponsable || '',
      celularResponsable: d.celularResponsable || '',
      firmasAutorizadas: d.firmasAutorizadas || false,
      cruzNombreYFecha: d.cruzNombreYFecha || false,
      materialPlaca: d.materialPlaca || '',
      medidasPlaca: d.medidasPlaca || ''
    };
  }

  verDetalles(d: DifuntoDTO) {
    this.difuntoSeleccionado = d;
    this.showModalDetalles = true;
  }

  cerrarModalDetalles() {
    this.showModalDetalles = false;
    this.difuntoSeleccionado = null;
  }

  eliminar(d: DifuntoDTO) {
    this.mostrarModalAlerta('confirmar', 'Eliminar Difunto', `¿Eliminar al difunto ${d.nombre}? El espacio quedará disponible.`, () => {
      this.difuntoService.eliminarDifunto(d.id).subscribe({
        next: () => { this.mostrarModalAlerta('exito', 'Éxito', 'Difunto eliminado correctamente'); this.cargarDifuntos(); },
        error: () => this.mostrarModalAlerta('error', 'Error', 'Error al eliminar difunto')
      });
    });
  }

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (!file) continue;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result.split(',')[1];
        this.nuevoDifunto.documentos.push({ nombre: file.name, data: base64 });
      };
      reader.readAsDataURL(file);
    }
  }

  verDocumento(doc: any) {
    if (!doc.data) {
      this.mostrarModalAlerta('error', 'Error', 'El documento no tiene datos válidos.');
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

  guardarDifunto() {
    if (!this.nuevoDifunto.nombre || !this.nuevoDifunto.fechaFallecimiento) {
      this.mostrarModalAlerta('error', 'Campos obligatorios', 'El nombre y la fecha de fallecimiento son obligatorios');
      return;
    }

    if (this.modoEdicion && this.difuntoActualId) {
      this.difuntoService.actualizarDifunto(this.difuntoActualId, this.nuevoDifunto as any).subscribe({
        next: () => { this.mostrarModalAlerta('exito', 'Éxito', 'Difunto actualizado correctamente!'); this.cerrarModal(); this.cargarDifuntos(); },
        error: () => this.mostrarModalAlerta('error', 'Error', 'Error al actualizar')
      });
    } else {
      if (!this.nuevoDifunto.espacioId) {
        this.mostrarModalAlerta('error', 'Espacio requerido', 'Debe seleccionar un espacio disponible');
        return;
      }
      this.difuntoService.registrarDifunto(this.nuevoDifunto as any).subscribe({
        next: () => { this.mostrarModalAlerta('exito', 'Éxito', '¡Difunto registrado y espacio ocupado!'); this.cerrarModal(); this.cargarDifuntos(); },
        error: () => this.mostrarModalAlerta('error', 'Error', 'Error al registrar')
      });
    }
  }
}
