import { environment } from 'src/environments/environment';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CementerioService } from '../../services/cementerio.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-detalle-cementerio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="header-section">
        <button class="btn-back" (click)="volver()">← Volver</button>
        <div>
          <h2 class="title">{{ cementerio?.nombre || 'Cargando...' }}</h2>
          <span class="badge" [class.private]="cementerio?.tienePrivado" *ngIf="cementerio">
            {{ cementerio.tienePrivado ? 'SEDE PRIVADA' : 'SEDE PÚBLICA' }}
          </span>
        </div>
      </div>

      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Cargando información exclusiva de este cementerio...</p>
      </div>

      <div class="content-wrapper" *ngIf="!loading && cementerio">
        <!-- Pestañas de Secciones -->
        <div class="secciones-tabs">
          <button 
            *ngFor="let sec of cementerio.secciones" 
            class="tab-btn" 
            [class.active]="seccionSeleccionada?.id === sec.id"
            (click)="seleccionarSeccion(sec)">
            Sección: {{ sec.nombre }}
          </button>
        </div>

        <div class="seccion-content" *ngIf="seccionSeleccionada">

          <!-- Filtros Superiores (Común para Público y Privado) -->
          <div class="top-filters-bar">
            <div class="filter-group">
              <label>Seleccionar Parcela</label>
              <select [(ngModel)]="parcelaSeleccionada" (ngModelChange)="seleccionarParcela($event)">
                <option *ngFor="let par of seccionSeleccionada.parcelas" [ngValue]="par">{{ par.nombre }}</option>
              </select>
            </div>
            <div class="filter-group" *ngIf="seccionSeleccionada.nombre === 'PRIVADO'">
              <label>Seleccionar Lote</label>
              <select [(ngModel)]="selectedLotePrivadoId" (change)="filtrarCriptas()">
                <option [ngValue]="null">Todos los Lotes</option>
                <option *ngFor="let c of criptasPrivadas" [value]="c.id">Lote F{{ c.fila }}-C{{ c.columna }}</option>
              </select>
            </div>
            <div class="filter-group search-group" *ngIf="seccionSeleccionada.nombre === 'PRIVADO'">
              <label>Buscar Lote/Propietario</label>
              <div class="search-input-wrapper">
                <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input 
                  type="text" 
                  [ngModel]="terminoBusqueda" 
                  placeholder="Buscar difunto o propietario..." 
                  class="search-input"
                  (input)="onSearchInput($event)"
                />
              </div>
            </div>
          </div>

          <!-- Información de la Parcela seleccionada -->
          <div class="parcela-detail" *ngIf="parcelaSeleccionada">
            <div class="detail-header">
              <div class="header-text-container">
                <h3>Información de {{ parcelaSeleccionada.nombre }}</h3>
                <p>Datos de <strong>{{ cementerio.nombre }}</strong></p>
              </div>
              <div class="search-container">
                <input 
                  type="text" 
                  [ngModel]="terminoBusqueda" 
                  placeholder="Buscar difunto..." 
                  class="search-input"
                  (input)="onSearchInput($event)"
                />
              </div>
            </div>

            <div class="table-card">
              <!-- VISTA PÚBLICA -->
              <div class="public-view" *ngIf="seccionSeleccionada.nombre !== 'PRIVADO'">
                <div class="public-lote-selector" *ngIf="criptasPublicas.length > 0" style="margin-bottom: 1rem; padding: 1rem; background: #f3f4f6; border-radius: 8px; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                  <div>
                    <label style="font-weight: 600; margin-right: 0.5rem; color: var(--text-main);">Fila:</label>
                    <select [(ngModel)]="selectedFilaPublica" (change)="actualizarColumnasPublicas()" style="padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid var(--border-color); min-width: 150px;">
                      <option *ngFor="let f of filasPublicas" [ngValue]="f">Fila {{ f }}</option>
                    </select>
                  </div>
                  <div>
                    <label style="font-weight: 600; margin-right: 0.5rem; color: var(--text-main);">Columna:</label>
                    <select [(ngModel)]="selectedColumnaPublica" (change)="actualizarLotePublicoDesdeFilaColumna()" style="padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid var(--border-color); min-width: 150px;">
                      <option *ngFor="let c of columnasPublicas" [ngValue]="c">Columna {{ c }}</option>
                    </select>
                  </div>
                </div>

                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Lote</th>
                        <th>Espacio</th>
                        <th>Estado</th>
                        <th>Difunto</th>
                        <th>DUI</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <ng-container *ngFor="let item of espaciosFiltrados">
                        <tr>
                          <td class="col-cripta">F{{ item.fila }} - C{{ item.columna }}</td>
                          <td class="col-espacio">Nº {{ item.numero }}</td>
                          <td>
                            <span class="status-badge" [ngClass]="(item.estado || 'DISPONIBLE').toLowerCase()">
                              {{ item.estado || 'DISPONIBLE' }}
                            </span>
                          </td>
                          <td class="col-difunto">{{ item.difunto || '-- Vacío --' }}</td>
                          <td>{{ item.difuntoObj?.dui || '--' }}</td>
                          <td>
                            <div class="action-buttons">
                              <button class="btn-xs btn-outline-pink" (click)="abrirModalVerDatos('difunto', item.difuntoObj)" *ngIf="item.difuntoObj">Ver Expediente</button>
                              <button class="btn-xs btn-outline-pink" (click)="editarEspacio(item)">Editar Datos</button>
                              <button class="btn-xs btn-outline-red" (click)="liberarEspacio(item)" *ngIf="item.difuntoObj">Liberar Espacio</button>
                            </div>
                          </td>
                        </tr>
                      </ng-container>
                      <tr *ngIf="espaciosFiltrados.length === 0">
                        <td colspan="5" class="text-center">No hay registros para mostrar en este lote.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

              <!-- VISTA PRIVADA (ACORDEÓN PAGINADO) -->
              <div class="private-view" *ngIf="seccionSeleccionada.nombre === 'PRIVADO'">
                <div class="lotes-grid accordion-layout">
                  <div class="lote-card accordion-card" *ngFor="let cr of criptasPaginadas">
                    <div class="lote-header" [class.vacant]="!cr.clienteObj" style="display: flex; flex-direction: column; gap: 0.5rem; padding: 1.2rem;">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h4 style="margin: 0; color: var(--text-main);">Lote F{{cr.fila}}-C{{cr.columna}}</h4>
                        <div>
                          <span class="lote-badge">{{ cr.espacios.length }} Espacios</span>
                          <span class="lote-badge" *ngIf="getEspaciosLibres(cr) > 0" style="background: #dcfce7; color: #16a34a; border-color: #86efac; margin-left: 0.5rem;">{{ getEspaciosLibres(cr) }} Disponibles</span>
                        </div>
                      </div>
                      
                      <div class="owner-info" style="margin-top: 0.5rem;">
                        <span style="font-size: 0.75rem; color: #db2777; font-weight: 700; text-transform: uppercase;">PROPIETARIO TITULAR</span>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.2rem;">
                          <strong style="color: #be185d; font-size: 1.1rem; text-transform: uppercase;">{{ cr.propietario }}</strong>
                          <div class="owner-actions">
                            <button *ngIf="cr.clienteObj" class="btn-xs btn-outline-pink" (click)="abrirModalVerDatos('propietario', cr.clienteObj)">Ver Expediente</button>
                            <button *ngIf="!cr.clienteObj" class="btn-xs btn-outline-pink" (click)="abrirModalPropietarioDirecto(cr.id)">Asignar Propietario</button>
                          </div>
                        </div>
                      </div>

                      <button class="btn-toggle-accordion" (click)="toggleLoteExpanded(cr)" style="margin-top: 1rem; width: 100%; padding: 0.5rem; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 0.5rem; color: var(--text-main); font-weight: 500; transition: all 0.2s;">
                        {{ cr.expanded ? 'Ocultar Espacios' : 'Ver Espacios (' + cr.espacios.length + ')' }}
                        <svg [style.transform]="cr.expanded ? 'rotate(180deg)' : 'rotate(0)'" style="transition: transform 0.3s;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </button>
                    </div>
                    
                    <div class="lote-body" *ngIf="cr.expanded" style="padding: 0; border-top: 1px solid var(--border-color);">
                      <div class="table-responsive" style="margin: 0; border: none; box-shadow: none;">
                        <table style="margin: 0; width: 100%; border-collapse: collapse;">
                          <thead>
                            <tr>
                              <th style="padding: 1rem; text-align: left; background: var(--table-header-bg); font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted);">Espacio</th>
                              <th style="padding: 1rem; text-align: left; background: var(--table-header-bg); font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted);">Estado</th>
                              <th style="padding: 1rem; text-align: left; background: var(--table-header-bg); font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted);">Difunto</th>
                              <th style="padding: 1rem; text-align: left; background: var(--table-header-bg); font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted);">DUI</th>
                              <th style="padding: 1rem; text-align: left; background: var(--table-header-bg); font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted);">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr *ngFor="let esp of cr.espacios" style="border-bottom: 1px solid var(--border-color);">
                              <td class="col-espacio" style="padding: 1rem; font-weight: 600; color: #d73387;">Nº {{ esp.numero }}</td>
                              <td style="padding: 1rem;">
                                <span class="status-badge" [ngClass]="(esp.estado || 'DISPONIBLE').toLowerCase()">
                                  {{ esp.estado || 'DISPONIBLE' }}
                                </span>
                              </td>
                              <td class="col-difunto" [class.empty-text]="!esp.difuntoObj" style="padding: 1rem;">{{ esp.difunto || '-- Vacío --' }}</td>
                              <td style="padding: 1rem;">{{ esp.difuntoObj?.dui || '--' }}</td>
                              <td style="padding: 1rem;">
                                <div class="action-buttons" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                  <button class="btn-xs btn-outline-pink" (click)="abrirModalVerDatos('difunto', esp.difuntoObj)" *ngIf="esp.difuntoObj">Ver Expediente</button>
                                  <button class="btn-xs btn-outline-pink" (click)="editarEspacio(esp)">Editar Datos</button>
                                  <button class="btn-xs btn-outline-red" (click)="liberarEspacio(esp)" *ngIf="esp.difuntoObj">Liberar Espacio</button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  <div class="empty-state-grid" *ngIf="criptasPaginadas.length === 0">
                    <p>No hay lotes que coincidan con los criterios de búsqueda.</p>
                  </div>
                </div>

                <!-- CONTROLES DE PAGINACIÓN -->
                <div class="pagination-controls" *ngIf="criptasPrivadasFiltradas.length > lotesPorPagina">
                  <button class="btn-page" (click)="cambiarPagina(-1)" [disabled]="paginaActual === 1">Anterior</button>
                  <span class="page-info">Página <strong>{{ paginaActual }}</strong> de <strong>{{ totalPaginasPrivado }}</strong></span>
                  <button class="btn-page" (click)="cambiarPagina(1)" [disabled]="paginaActual === totalPaginasPrivado">Siguiente</button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="parcela-detail empty-detail" *ngIf="!parcelaSeleccionada">
            <p>Seleccione una parcela de la lista para ver su información.</p>
          </div>
        </div>
      </div>

      <!-- ========== MODAL AÑADIR PROPIETARIO ========== -->
      <div class="modal-overlay" *ngIf="modalPropietario.visible" (click)="cerrarModalPropietario()">
        <div class="modal-box modal-propietario" (click)="$event.stopPropagation()">
          <div class="modal-prop-header">
            <div>
              <h3 class="modal-title">Asignar Propietario</h3>
              <p class="modal-subtitle">Selecciona el lote e ingresa los datos del propietario</p>
            </div>
            <button class="btn-close-x" (click)="cerrarModalPropietario()">✕</button>
          </div>

          <div class="modal-prop-body">
            <div class="mp-section-title">Ubicación del Lote</div>
            <div class="mp-row-2">
              <div class="form-group">
                <label>Parcela <span class="req">*</span></label>
                <select [(ngModel)]="propParcelaId" (ngModelChange)="onPropParcelaIdChange($event)">
                  <option [value]="null" disabled>Seleccione parcela...</option>
                  <option *ngFor="let p of parcelasPrivadas" [value]="p.id">{{ p.nombre }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Lote (Fila - Columna) <span class="req">*</span></label>
                <select [(ngModel)]="propCriptaId" [disabled]="lotesDisponibles.length === 0">
                  <option [value]="null" disabled>{{ lotesDisponibles.length === 0 ? 'Seleccione parcela primero' : 'Seleccione lote...' }}</option>
                  <option *ngFor="let cr of lotesDisponibles" [value]="cr.id">
                    Fila {{ cr.fila }} – Col {{ cr.columna }}{{ cr.cliente ? ' (Prop: ' + cr.cliente.nombre + ')' : '' }}
                  </option>
                </select>
              </div>
            </div>

            <div class="mp-divider"></div>
            <div class="mp-section-title">Datos del Propietario</div>

            <div class="mp-row-2">
              <div class="form-group">
                <label>DUI <span class="req">*</span></label>
                <input type="text" [value]="propDui" (input)="onPropDuiInput($event)" placeholder="00000000-0" maxlength="10">
              </div>
              <div class="form-group">
                <label>Nombre Completo <span class="req">*</span></label>
                <input type="text" [(ngModel)]="propNombre" placeholder="Nombre del propietario">
              </div>
            </div>

            <div class="mp-row-2">
              <div class="form-group">
                <label>Teléfono</label>
                <input type="text" [(ngModel)]="propTelefono" placeholder="7777-7777">
              </div>
              <div class="form-group">
                <label>Correo Electrónico</label>
                <input type="email" [(ngModel)]="propCorreo" placeholder="correo@ejemplo.com">
              </div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
              <label>Subir Documento PDF/Imagen</label>
              <input type="file" (change)="onPropFileSelected($event)" accept=".pdf,image/*" style="display: block; width: 100%; border: 1px solid var(--border-color); border-radius: 8px; padding: 0.8rem; font-family: inherit; font-size: 0.9rem;">
              <p *ngIf="propFile.file" style="margin-top: 0.5rem; font-size: 0.85rem; color: #10b981;">Archivo seleccionado: {{ $any(propFile.file).name }}</p>
            </div>
          </div>

          <div class="modal-prop-footer">
            <button class="btn-modal btn-cancel" (click)="cerrarModalPropietario()">Cancelar</button>
            <button class="btn-modal btn-confirm" 
              (click)="asignarPropietario()"
              [disabled]="!propCriptaId || !propDui || !propNombre">
              Asignar Propietario
            </button>
          </div>
        </div>
      </div>

      <!-- MODAL GENÉRICO -->
      <div class="modal-overlay" *ngIf="modal.visible" (click)="cerrarModal()" [ngStyle]="{'z-index': '99999'}">
        <div class="modal-box" (click)="$event.stopPropagation()"
             [class.modal-error]="modal.tipo === 'error'"
             [class.modal-exito]="modal.tipo === 'exito'"
             [class.modal-confirmar]="modal.tipo === 'confirmar'">
          <div class="modal-icon" *ngIf="modal.tipo === 'error'">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <div class="modal-icon" *ngIf="modal.tipo === 'exito'">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="16 8 10 16 7 13"/></svg>
          </div>
          <div class="modal-icon" *ngIf="modal.tipo === 'confirmar'">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 class="modal-title">{{ modal.titulo }}</h3>
          <p class="modal-msg">{{ modal.mensaje }}</p>
          <div class="modal-actions">
            <button class="btn-modal btn-cancel" (click)="cerrarModal()">{{ modal.tipo === 'confirmar' ? 'Cancelar' : 'Cerrar' }}</button>
            <button class="btn-modal btn-confirm" *ngIf="modal.tipo === 'confirmar'" (click)="confirmarModal()">Confirmar</button>
          </div>
        </div>
      </div>

      <!-- MODAL EDITAR DIFUNTO -->
      <div class="modal-overlay" *ngIf="editModal.visible" (click)="cancelarEditar()">
        <div class="modal-box modal-wide" (click)="$event.stopPropagation()">
          <h3 class="modal-title">Editar Datos del Difunto</h3>
          <p class="modal-subtitle" style="margin-bottom: 1.5rem;">Complete la información relacionada con el espacio.</p>
          
          <div class="edit-form" style="max-height: 65vh; overflow-y: auto; padding-right: 10px;">
            <h4 style="margin-bottom: 1rem; color: #d63384; font-size: 1rem; border-bottom: 2px solid #fbcfe8; padding-bottom: 0.5rem;">Datos Personales del Difunto</h4>
            <div class="mp-row-1" style="margin-bottom: 1rem;">
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Nombre completo *</label>
                <input type="text" [(ngModel)]="editModal.nombre" placeholder="Nombre del difunto" class="edit-input">
              </div>
            </div>
            
            <div class="mp-row-3" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Identificación *</label>
                <select [(ngModel)]="editModal.tipoDocumentoDifunto" (change)="onTipoDocumentoChange()" class="edit-input" style="width: 100%;">
                  <option value="DUI">DUI (Mayor)</option>
                  <option value="PARTIDA">Partida de Nacimiento (Menor)</option>
                </select>
              </div>
              <div class="form-group" style="grid-column: span 2;" *ngIf="editModal.tipoDocumentoDifunto === 'DUI' || !editModal.tipoDocumentoDifunto">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">DUI *</label>
                <input type="text" [(ngModel)]="editModal.dui" (input)="onDuiInput($event)" maxlength="10" placeholder="Ej: 01234567-8" class="edit-input">
              </div>
              <div class="form-group" style="grid-column: span 2;" *ngIf="editModal.tipoDocumentoDifunto === 'PARTIDA'">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Partida de Nacimiento (PDF/Img) *</label>
                <input type="file" (change)="onPartidaSelected($event)" accept=".pdf,.doc,.docx,.jpg,.png" class="edit-input">
              </div>
            </div>
            
            <div class="mp-row-3" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Edad Calculada</label>
                <input type="text" [(ngModel)]="editModal.edad" class="edit-input" placeholder="Automática" readonly style="background-color: var(--card-bg); cursor: not-allowed;">
              </div>
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Sexo</label>
                <select [(ngModel)]="editModal.sexo" class="edit-input" style="width: 100%;">
                  <option value="">Seleccione</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                </select>
              </div>
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Estado Civil</label>
                <select [(ngModel)]="editModal.estadoCivil" class="edit-input" style="width: 100%;">
                  <option value="">Seleccione</option>
                  <option value="SOLTERO(A)">Soltero(a)</option>
                  <option value="CASADO(A)">Casado(a)</option>
                  <option value="VIUDO(A)">Viudo(a)</option>
                  <option value="DIVORCIADO(A)">Divorciado(a)</option>
                  <option value="ACOMPAÑADO(A)">Acompañado(a)</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 2rem;">
              <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Domicilio del Fallecido</label>
              <input type="text" [(ngModel)]="editModal.domicilioFallecido" class="edit-input" placeholder="Dirección completa">
            </div>

            <h4 style="margin-bottom: 1rem; color: #d63384; font-size: 1rem; border-bottom: 2px solid #fbcfe8; padding-bottom: 0.5rem;">Datos Médicos y Fallecimiento</h4>
            <div class="mp-row-2" style="margin-bottom: 1rem;">
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Fecha de Fallecimiento *</label>
                <input type="date" [(ngModel)]="editModal.fechaFallecimiento" class="edit-input" (change)="calcularEdad()">
              </div>
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Hora de Fallecimiento</label>
                <input type="time" [(ngModel)]="editModal.horaFallecimiento" class="edit-input">
              </div>
            </div>
            <div class="mp-row-2" style="margin-bottom: 2rem;">
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Causa de la muerte</label>
                <input type="text" [(ngModel)]="editModal.causaMuerte" class="edit-input" placeholder="Causa según dictamen médico">
              </div>
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Fecha de Nacimiento</label>
                <input type="date" [(ngModel)]="editModal.fechaNacimiento" class="edit-input" (change)="calcularEdad()">
              </div>
            </div>

            <h4 style="margin-bottom: 1rem; color: #d63384; font-size: 1rem; border-bottom: 2px solid #fbcfe8; padding-bottom: 0.5rem;">Datos del Responsable</h4>
            <div class="mp-row-2" style="margin-bottom: 1rem;">
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Nombre del Responsable</label>
                <input type="text" [(ngModel)]="editModal.nombreResponsable" class="edit-input" placeholder="Responsable del entierro">
              </div>
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">DUI Responsable *</label>
                <input type="text" [(ngModel)]="editModal.duiResponsable" (input)="onDuiResponsableInput($event)" maxlength="10" class="edit-input" placeholder="Ej: 01234567-8">
              </div>
            </div>
            <div class="mp-row-2" style="margin-bottom: 1rem;">
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Celular *</label>
                <input type="text" [(ngModel)]="editModal.celularResponsable" (input)="onTelefonoInput($event)" maxlength="8" class="edit-input" placeholder="Ej: 77777777">
              </div>
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Domicilio del Responsable</label>
                <input type="text" [(ngModel)]="editModal.domicilioResponsable" class="edit-input" placeholder="Dirección del responsable">
              </div>
            </div>
            <div class="form-group" style="margin-bottom: 2rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; font-weight: 500; color: var(--text-main); cursor: pointer;">
                <input type="checkbox" [(ngModel)]="editModal.firmasAutorizadas" style="width: 18px; height: 18px; cursor: pointer;"> 
                Confirmo que el Administrador y el Responsable han firmado la boleta física.
              </label>
            </div>

            <h4 style="margin-bottom: 1rem; color: #d63384; font-size: 1rem; border-bottom: 2px solid #fbcfe8; padding-bottom: 0.5rem;">Ubicación e Inhumación</h4>
            <div class="mp-row-2" style="margin-bottom: 1rem;">
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Fecha de Entierro</label>
                <input type="date" [(ngModel)]="editModal.fechaEntierro" class="edit-input">
              </div>
              <div class="form-group">
                <label style="font-weight: 600; color: var(--text-main); display: block; margin-bottom: 0.4rem;">Hora de Entierro</label>
                <input type="time" [(ngModel)]="editModal.horaEntierro" class="edit-input">
              </div>
            </div>

            <h4 style="margin-bottom: 1rem; color: #d63384; font-size: 1rem; border-bottom: 2px solid #fbcfe8; padding-bottom: 0.5rem;">Documentación Adjunta</h4>
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label style="font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 0.4rem;">Boleta, DICTAMEN o Certificados (PDF/Word)</label>
              <input type="file" (change)="onEditDifuntoFileSelectedMulti($event)" multiple accept=".pdf,.doc,.docx,image/*" style="display: block; width: 100%; border: 1px dashed var(--text-muted); border-radius: 8px; padding: 1.5rem; background: var(--table-header-bg); font-family: inherit; font-size: 0.9rem; text-align: center; cursor: pointer; color: var(--text-main);">
              
              <ul style="list-style: none; padding: 0; margin-top: 1rem;" *ngIf="editModal.documentos && editModal.documentos.length">
                <li *ngFor="let doc of editModal.documentos; let i = index" style="background: var(--hover-bg); padding: 0.5rem 0.8rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 0.3rem; display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
                    <svg style="margin-right:4px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span>{{ doc.nombre }}</span>
                  </div>
                  <span (click)="editModal.documentos.splice(i, 1)" style="color: #ef4444; font-weight: bold; cursor: pointer; padding: 0 0.5rem;">✕</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div class="modal-actions" style="margin-top: 2rem;">
            <button class="btn-modal btn-cancel" (click)="cancelarEditar()">Cancelar</button>
            <button class="btn-modal btn-confirm" (click)="guardarEdicion()">Guardar Datos</button>
          </div>
        </div>
      </div>

      <!-- MODAL VER DATOS COMPLETOS -->
      <div class="modal-overlay" *ngIf="modalVerDatos.visible" (click)="cerrarModalVerDatos()">
        <div class="modal-box modal-wide" (click)="$event.stopPropagation()">
          <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; border-bottom: 2px solid #fce4f0; margin-bottom: 1.5rem;">
            <h2 style="margin: 0; color: #d63384; font-size: 1.3rem;">Expediente Completo</h2>
            <button class="btn-close-modal" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #999;" (click)="cerrarModalVerDatos()">✕</button>
          </div>
          
          <div class="modal-body detalles-body" *ngIf="modalVerDatos.datos" style="max-height: 70vh; overflow-y: auto; padding-right: 10px;">
            <div class="detalle-item">
              <span class="label">Nombre Completo:</span>
              <span class="value" style="display: flex; align-items: center; gap: 0.5rem;">
                {{ modalVerDatos.datos.nombre }}
                <span class="tipo-badge" [ngClass]="modalVerDatos.tipo === 'difunto' ? 'publico' : 'privado'" style="font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid #bae6fd; background: #e0f2fe; color: #0369a1;">{{ modalVerDatos.tipo | uppercase }}</span>
              </span>
            </div>
            <div class="detalle-item" *ngIf="modalVerDatos.datos.dui">
              <span class="label">DUI:</span>
              <span class="value">{{ modalVerDatos.datos.dui }}</span>
            </div>

            <div class="detalle-grid" *ngIf="modalVerDatos.tipo === 'propietario'">
              <div class="detalle-item">
                <span class="label">Teléfono:</span>
                <span class="value">{{ modalVerDatos.datos.telefono || 'No registrado' }}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Correo Electrónico:</span>
                <span class="value">{{ modalVerDatos.datos.correo || 'No registrado' }}</span>
              </div>
            </div>

            <div class="detalle-grid" *ngIf="modalVerDatos.tipo === 'difunto'">
              <div class="detalle-item">
                <span class="label">Fecha Fallecimiento:</span>
                <span class="value">{{ modalVerDatos.datos.fechaFallecimiento || 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Hora Fallecimiento:</span>
                <span class="value">{{ modalVerDatos.datos.horaFallecimiento || 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Fecha Entierro:</span>
                <span class="value">{{ modalVerDatos.datos.fechaEntierro || 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Hora Entierro:</span>
                <span class="value">{{ modalVerDatos.datos.horaEntierro || 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Causa de Muerte:</span>
                <span class="value">{{ modalVerDatos.datos.causaMuerte || 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Tipo de Registro:</span>
                <span class="value">{{ modalVerDatos.datos.esPrivado ? 'PRIVADO' : 'PÚBLICO' }}</span>
              </div>
            </div>

            <hr class="divider" *ngIf="modalVerDatos.tipo === 'difunto'">
            <h3 *ngIf="modalVerDatos.tipo === 'difunto'" style="margin-top: 1rem; margin-bottom: 0.5rem; color: var(--text-main); font-size: 1rem;">Datos Personales</h3>
            <div class="detalle-grid" *ngIf="modalVerDatos.tipo === 'difunto'">
              <div class="detalle-item">
                <span class="label">Fecha Nacimiento:</span>
                <span class="value">{{ modalVerDatos.datos.fechaNacimiento || 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Edad:</span>
                <span class="value">{{ modalVerDatos.datos.edad ? modalVerDatos.datos.edad + ' años' : 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Sexo:</span>
                <span class="value">{{ modalVerDatos.datos.sexo || 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Estado Civil:</span>
                <span class="value">{{ modalVerDatos.datos.estadoCivil || 'N/A' }}</span>
              </div>
              <div class="detalle-item" style="grid-column: span 2;">
                <span class="label">Domicilio del Fallecido:</span>
                <span class="value">{{ modalVerDatos.datos.domicilioFallecido || 'N/A' }}</span>
              </div>
            </div>

            <hr class="divider" *ngIf="modalVerDatos.tipo === 'difunto'">
            <h3 *ngIf="modalVerDatos.tipo === 'difunto'" style="margin-top: 1rem; margin-bottom: 0.5rem; color: var(--text-main); font-size: 1rem;">Responsable</h3>
            <div class="detalle-grid" *ngIf="modalVerDatos.tipo === 'difunto'">
              <div class="detalle-item">
                <span class="label">Nombre Responsable:</span>
                <span class="value">{{ modalVerDatos.datos.nombreResponsable || 'N/A' }}</span>
              </div>
              <div class="detalle-item">
                <span class="label">Celular:</span>
                <span class="value">{{ modalVerDatos.datos.celularResponsable || 'N/A' }}</span>
              </div>
              <div class="detalle-item" style="grid-column: span 2;">
                <span class="label">Domicilio Responsable:</span>
                <span class="value">{{ modalVerDatos.datos.domicilioResponsable || 'N/A' }}</span>
              </div>
              <div class="detalle-item" style="grid-column: span 2;">
                <span class="label">Firmas Autorizadas:</span>
                <span class="value">{{ modalVerDatos.datos.firmasAutorizadas ? 'Sí' : 'No' }}</span>
              </div>
            </div>
            

            <hr class="divider" *ngIf="modalVerDatos.documentosCargados && modalVerDatos.documentosCargados.length > 0">
            <div class="detalle-item" *ngIf="modalVerDatos.documentosCargados && modalVerDatos.documentosCargados.length > 0">
              <span class="label">Documentos Adjuntos:</span>
              <ul class="value-list" style="list-style: none; padding: 0; margin-top: 0.5rem;">
                <li *ngFor="let doc of modalVerDatos.documentosCargados" style="background: #f3f4f6; padding: 0.5rem 0.8rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 0.3rem; display: flex; align-items: center; justify-content: space-between;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 600;">
                    <svg style="margin-right:4px;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    <span>{{ doc.nombre }}</span>
                  </div>
                  <div style="display: flex; gap: 0.5rem;">
                    <ng-container *ngIf="doc.base64Archivo">
                      <a href="javascript:void(0)" (click)="verDocumentoBase64(doc)" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">Ver</a>
                      <a href="javascript:void(0)" (click)="descargarDocumentoBase64(doc)" style="color: #10b981; text-decoration: underline; cursor: pointer;">Descargar</a>
                      <a href="javascript:void(0)" *ngIf="isAdmin" (click)="eliminarDocumento(doc.id)" style="color: #ef4444; text-decoration: underline; cursor: pointer;" title="Eliminar documento">Eliminar</a>
                    </ng-container>
                    <ng-container *ngIf="doc.data">
                      <a href="javascript:void(0)" (click)="descargarDocumentoPropio(doc)" style="color: #10b981; text-decoration: underline; cursor: pointer;">Descargar / Ver</a>
                    </ng-container>
                  </div>
                </li>
              </ul>
            </div>

            <hr class="divider" *ngIf="modalVerDatos.tipo === 'propietario' || modalVerDatos.tipo === 'difunto'">

            <div class="detalle-item" *ngIf="modalVerDatos.tipo === 'propietario' || modalVerDatos.tipo === 'difunto'">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span class="label" style="margin: 0; display: flex; align-items: center; gap: 0.5rem;">Historial de Pagos
                  <span class="status-badge" [class.success]="estadoPagoModalVer === 'Al Día'" [class.error]="estadoPagoModalVer !== 'Al Día'">
                    {{ estadoPagoModalVer }}
                  </span>
                </span>
              </div>
              
              <div *ngIf="!modalVerDatos.pagosCargados || modalVerDatos.pagosCargados.length === 0" style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1rem 0; background: #f9fafb; border-radius: 8px;">
                No hay pagos registrados
              </div>

              <div *ngFor="let pago of modalVerDatos.pagosCargados" style="display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); border: 1px solid var(--border-color); padding: 0.8rem 1rem; border-radius: 8px; margin-bottom: 0.5rem;">
                <div style="display: flex; flex-direction: column; gap: 0.2rem;">
                  <strong style="color: var(--text-main); font-size: 0.95rem;">{{ pago.concepto }}</strong>
                  <span style="color: var(--text-muted); font-size: 0.8rem;">{{ pago.fecha }}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <span style="font-family: monospace; font-weight: bold; color: var(--text-main); font-size: 1.1rem;">$ {{ pago.monto }}</span>
                  <span class="status-badge" [ngStyle]="{'background': pago.estado === 'PAGADO' ? '#dcfce7' : '#fee2e2', 'color': pago.estado === 'PAGADO' ? '#16a34a' : '#ef4444'}" style="padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800;">
                    {{ pago.estado }}
                  </span>
                </div>
              </div>
            </div>

          </div>
          <div class="modal-actions" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f3e6ef; display: flex; justify-content: flex-end;">
            <button class="btn-modal btn-cancel" (click)="cerrarModalVerDatos()">Cerrar</button>
          </div>
        </div>
      </div>

      <!-- MODAL PAGO NUEVO -->
      <div class="modal-overlay" *ngIf="modalPago.visible" (click)="cerrarModalPago()">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <h3 class="modal-title">Registrar Nuevo Pago</h3>
          <p class="modal-subtitle" style="margin-bottom: 1.5rem;">Ingrese los detalles del pago realizado.</p>
          
          <div class="form-group" style="margin-bottom: 1rem;">
            <label>Monto a Pagar ($) <span class="req">*</span></label>
            <input type="number" [(ngModel)]="modalPago.monto" class="edit-input" placeholder="0.00" min="0.01" step="0.01">
          </div>
          
          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label>Concepto / Descripción <span class="req">*</span></label>
            <input type="text" [(ngModel)]="modalPago.concepto" class="edit-input" placeholder="Ej. Mantenimiento Anual 2026">
          </div>

          <div class="modal-actions" style="margin-top: 1rem;">
            <button class="btn-modal btn-cancel" (click)="cerrarModalPago()">Cancelar</button>
            <button class="btn-modal btn-confirm" (click)="confirmarRegistroPago()" [disabled]="!modalPago.monto || !modalPago.concepto">Registrar Pago</button>
          </div>
        </div>
      </div>
  `,
  styleUrls: ['./detalle-cementerio.component.css']
})
export class DetalleCementerioComponent implements OnInit {
  cementerioId: number | null = null;
  cementerio: any = null;
  loading = true;

  seccionSeleccionada: any = null;
  parcelaSeleccionada: any = null;

  terminoBusqueda: string = '';
  criptasPublicas: any[] = [];
  selectedLotePublicoId: number | null = null;
  filasPublicas: number[] = [];
  columnasPublicas: number[] = [];
  selectedFilaPublica: number | null = null;
  selectedColumnaPublica: number | null = null;
  espaciosAplanados: any[] = [];
  espaciosFiltrados: any[] = [];

  criptasPrivadas: any[] = [];
  criptasPrivadasFiltradas: any[] = [];
  criptasPaginadas: any[] = [];
  paginaActual: number = 1;
  lotesPorPagina: number = 5;
  selectedLotePrivadoId: number | null = null;
  selectedCriptaPrivadaObj: any = null;

  // Modal propietario
  modalPropietario = { visible: false };
  parcelasPrivadas: any[] = [];
  propParcelaId: number | null = null;
  propCriptaId: number | null = null;
  propDui = '';
  propNombre = '';
  propTelefono = '';
  propCorreo = '';
  propDocumentos = '';
  propFile: { file: File | null, base64: string } = { file: null, base64: '' };
  lotesDisponibles: any[] = [];

  // Estado para añadir beneficiario inline
  addBenState = { criptaId: null as number | null, nombre: '', dui: '' };
  // Estado para editar beneficiario inline
  editBenState = { benId: null as number | null, criptaId: null as number | null, nombre: '', dui: '' };

  // Modal genérico
  modal = {
    visible: false,
    tipo: '' as 'error' | 'exito' | 'confirmar',
    titulo: '',
    mensaje: '',
    confirmarCallback: null as (() => void) | null
  };

  // Modal editar difunto
  editModal = {
    visible: false,
    espacioId: null as number | null,
    nombre: '',
    dui: '',
    fechaNacimiento: '',
    fechaFallecimiento: '',
    fechaEntierro: '',
    edad: '',
    sexo: '',
    estadoCivil: '',
    causaMuerte: '',
    domicilioFallecido: '',
    nombreResponsable: '',
    duiResponsable: '',
    domicilioResponsable: '',
    celularResponsable: '',
    tipoDocumentoDifunto: 'DUI',
    firmasAutorizadas: false,
    horaFallecimiento: '',
    horaEntierro: '',
    materialPlaca: '',
    medidasPlaca: '',
    documentos: [] as any[],
    difuntoObj: null as any
  };

  // Modal para ver datos completos
  modalVerDatos = {
    visible: false,
    tipo: 'propietario' as 'propietario' | 'beneficiario' | 'difunto',
    datos: null as any,
    documentosCargados: [] as any[],
    pagosCargados: [] as any[]
  };

  get estadoPagoModalVer(): string {
    if (!this.modalVerDatos.pagosCargados || this.modalVerDatos.pagosCargados.length === 0) return 'Sin Pagos';
    const tienePendiente = this.modalVerDatos.pagosCargados.some(p => p.estado === 'PENDIENTE');
    return tienePendiente ? 'Pendiente' : 'Al Día';
  }

  // Modal para pagos
  modalPago = {
    visible: false,
    monto: null as number | null,
    concepto: ''
  };

  isAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cementerioService: CementerioService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const rol = localStorage.getItem('rol');
    this.isAdmin = rol === 'ADMIN' || rol === 'ADMINISTRADOR';

    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.cementerioId = parseInt(idStr, 10);
        this.cargarDetalle();
      } else {
        this.volver();
      }
    });
  }

  cargarDetalle() {
    this.loading = true;
    this.cementerioService.getDetalleCementerio(this.cementerioId!).subscribe({
      next: (data) => {
        this.cementerio = data;
        this.loading = false;
        if (this.cementerio.secciones && this.cementerio.secciones.length > 0) {
          const prev = this.seccionSeleccionada;
          const sameSec = prev ? this.cementerio.secciones.find((s: any) => s.id === prev.id) : null;
          this.seleccionarSeccion(sameSec || this.cementerio.secciones[0]);
        }
      },
      error: () => {
        this.mostrarModal('error', 'Error', 'Error al cargar la información.');
        this.volver();
      }
    });
  }

  seleccionarSeccion(sec: any) {
    this.seccionSeleccionada = sec;
    this.parcelaSeleccionada = null;
    this.espaciosAplanados = [];
    this.espaciosFiltrados = [];
    this.criptasPrivadas = [];
    this.criptasPrivadasFiltradas = [];
    this.criptasPaginadas = [];
    this.selectedLotePrivadoId = null;
    this.selectedCriptaPrivadaObj = null;
    this.criptasPublicas = [];
    this.selectedLotePublicoId = null;
    this.paginaActual = 1;
    if (sec.parcelas && sec.parcelas.length > 0) {
      this.seleccionarParcela(sec.parcelas[0]);
    }
  }

  seleccionarParcela(par: any) {
    this.parcelaSeleccionada = par;
    this.terminoBusqueda = '';
    this.selectedLotePrivadoId = null;
    this.selectedCriptaPrivadaObj = null;
    this.paginaActual = 1;
    if (this.seccionSeleccionada && this.seccionSeleccionada.nombre === 'PRIVADO') {
      this.agruparCriptas();
    } else {
      this.criptasPublicas = par.criptas || [];
      this.filasPublicas = [...new Set(this.criptasPublicas.map((c: any) => c.fila))].sort((a: any, b: any) => a - b);
      
      if (this.filasPublicas.length > 0) {
        this.selectedFilaPublica = this.filasPublicas[0];
      } else {
        this.selectedFilaPublica = null;
      }
      this.actualizarColumnasPublicas();
    }
  }

  actualizarColumnasPublicas() {
    if (this.selectedFilaPublica !== null) {
      this.columnasPublicas = [...new Set(this.criptasPublicas.filter((c: any) => c.fila === this.selectedFilaPublica).map((c: any) => c.columna))].sort((a: any, b: any) => a - b);
      if (this.columnasPublicas.length > 0) {
        this.selectedColumnaPublica = this.columnasPublicas[0];
      } else {
        this.selectedColumnaPublica = null;
      }
    } else {
      this.columnasPublicas = [];
      this.selectedColumnaPublica = null;
    }
    this.actualizarLotePublicoDesdeFilaColumna();
  }

  actualizarLotePublicoDesdeFilaColumna() {
    if (this.selectedFilaPublica !== null && this.selectedColumnaPublica !== null) {
      const lote = this.criptasPublicas.find((c: any) => c.fila == this.selectedFilaPublica && c.columna == this.selectedColumnaPublica);
      this.selectedLotePublicoId = lote ? lote.id : null;
    } else {
      this.selectedLotePublicoId = null;
    }
    this.actualizarLotePublico();
  }

  actualizarLotePublico() {
    this.espaciosAplanados = [];
    if (this.selectedLotePublicoId) {
      const lote = this.criptasPublicas.find(c => c.id == this.selectedLotePublicoId);
      if (lote && lote.espacios) {
        for (const esp of lote.espacios) {
          this.espaciosAplanados.push({
            id: esp.id,
            fila: lote.fila,
            columna: lote.columna,
            numero: esp.numero,
            estado: esp.estado || 'DISPONIBLE',
            difunto: esp.difunto ? esp.difunto.nombre : null,
            difuntoObj: esp.difunto || null
          });
        }
      }
    }
    this.espaciosAplanados.sort((a, b) => a.numero - b.numero);
    this.filtrarEspacios();
  }

  // ===== MODAL PROPIETARIO =====
  abrirModalPropietario() {
    // Cargar parcelas de la sección privada actual
    this.parcelasPrivadas = this.seccionSeleccionada?.parcelas || [];
    this.propParcelaId = null;
    this.propCriptaId = null;
    this.propDui = '';
    this.propNombre = '';
    this.propTelefono = '';
    this.propCorreo = '';
    this.propDocumentos = '';
    this.propFile = { file: null, base64: '' };
    this.lotesDisponibles = [];
    this.modalPropietario.visible = true;
  }

  cerrarModalPropietario() {
    this.modalPropietario.visible = false;
  }

  onPropParcelaIdChange(parcelaId: number) {
    this.propCriptaId = null;
    this.lotesDisponibles = [];
    if (!parcelaId) return;
    const parcela = this.parcelasPrivadas.find(p => p.id == parcelaId);
    if (parcela) {
      this.lotesDisponibles = parcela.criptas || [];
    }
  }

  abrirModalPropietarioDirecto(criptaId: number) {
    this.abrirModalPropietario();
    // Autoseleccionar la parcela y cripta actual
    if (this.parcelaSeleccionada) {
      this.propParcelaId = this.parcelaSeleccionada.id;
      this.onPropParcelaIdChange(this.propParcelaId!);
      this.propCriptaId = criptaId;
    }
  }

  onPropDuiInput(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 9) val = val.substring(0, 9);
    if (val.length > 8) val = val.substring(0, 8) + '-' + val.substring(8);
    this.propDui = val;
    event.target.value = val;
  }

  asignarPropietario() {
    if (!this.propCriptaId || !this.propDui || !this.propNombre) return;
    this.cementerioService.asignarPropietario(
      this.propCriptaId, this.propDui, this.propNombre,
      this.propTelefono || undefined, this.propCorreo || undefined, this.propDocumentos || undefined
    ).subscribe({
      next: (res: any) => {
        if (this.propFile.file && res.cliente && res.cliente.id) {
          this.cementerioService.subirDocumento(this.propFile.file.name, this.propFile.base64, res.cliente.id, undefined).subscribe({
            next: () => this.finalizarAsignarPropietario(),
            error: () => this.finalizarAsignarPropietario()
          });
        } else {
          this.finalizarAsignarPropietario();
        }
      },
      error: (err) => {
        if (err.error?.error === 'DUI_DUPLICADO' || err.error?.message === 'DUI_DUPLICADO' || (err.error && typeof err.error === 'string' && err.error.includes('DUI_DUPLICADO'))) {
          this.mostrarModal('error', 'DUI Duplicado', 'Atención: El DUI ingresado ya se encuentra registrado en el sistema.');
        } else {
          this.mostrarModal('error', 'Error', 'No se pudo asignar el propietario. Verifique los datos e intente de nuevo.');
        }
      }
    });
  }

  finalizarAsignarPropietario() {
    this.cerrarModalPropietario();
    this.mostrarModal('exito', 'Propietario Asignado', 'El propietario fue asignado correctamente al lote.');
    this.cargarDetalle();
  }

  onPropFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.propFile = { file, base64: e.target.result };
      };
      reader.readAsDataURL(file);
    }
  }

  // ===== BENEFICIARIOS =====
  abrirAddBeneficiario(cr: any) {
    this.addBenState = { criptaId: cr.id, nombre: '', dui: '' };
    this.editBenState = { benId: null, criptaId: null, nombre: '', dui: '' };
  }

  cancelarAddBeneficiario() {
    this.addBenState = { criptaId: null, nombre: '', dui: '' };
  }

  onAddBenDuiInput(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 9) val = val.substring(0, 9);
    if (val.length > 8) val = val.substring(0, 8) + '-' + val.substring(8);
    this.addBenState.dui = val;
    event.target.value = val;
  }

  guardarNuevoBeneficiario(cr: any) {
    if (!this.addBenState.nombre) return;
    this.cementerioService.agregarBeneficiario(cr.id, this.addBenState.nombre, this.addBenState.dui || undefined).subscribe({
      next: () => {
        this.cancelarAddBeneficiario();
        this.cargarDetalle();
      },
      error: (err) => {
        if (err.error?.error === 'DUI_DUPLICADO' || err.error?.message === 'DUI_DUPLICADO' || (err.error && typeof err.error === 'string' && err.error.includes('DUI_DUPLICADO'))) {
          this.mostrarModal('error', 'DUI Duplicado', 'Atención: El DUI ingresado ya se encuentra registrado en el sistema.');
        } else {
          this.mostrarModal('error', 'Error', 'No se pudo agregar el beneficiario.');
        }
      }
    });
  }

  iniciarEditBeneficiario(b: any, cr: any) {
    this.editBenState = { benId: b.id, criptaId: cr.id, nombre: b.nombre, dui: b.dui || '' };
    this.addBenState = { criptaId: null, nombre: '', dui: '' };
  }

  cancelarEditBeneficiario() {
    this.editBenState = { benId: null, criptaId: null, nombre: '', dui: '' };
  }

  onEditBenDuiInput(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 9) val = val.substring(0, 9);
    if (val.length > 8) val = val.substring(0, 8) + '-' + val.substring(8);
    this.editBenState.dui = val;
    event.target.value = val;
  }

  guardarEditBeneficiario() {
    if (!this.editBenState.benId) return;
    this.cementerioService.editarBeneficiario(this.editBenState.benId, this.editBenState.nombre, this.editBenState.dui || undefined).subscribe({
      next: () => {
        this.cancelarEditBeneficiario();
        this.cargarDetalle();
      },
      error: (err) => {
        if (err.error?.error === 'DUI_DUPLICADO' || err.error?.message === 'DUI_DUPLICADO' || (err.error && typeof err.error === 'string' && err.error.includes('DUI_DUPLICADO'))) {
          this.mostrarModal('error', 'DUI Duplicado', 'Atención: El DUI ingresado ya se encuentra registrado en el sistema.');
        } else {
          this.mostrarModal('error', 'Error', 'No se pudo editar el beneficiario.');
        }
      }
    });
  }

  pedirEliminarBeneficiario(b: any) {
    this.mostrarModal('confirmar', 'Eliminar Beneficiario',
      '¿Desea eliminar al beneficiario "' + b.nombre + '"? Esta acción es permanente.',
      () => {
        this.cementerioService.eliminarBeneficiario(b.id).subscribe({
          next: () => this.cargarDetalle(),
          error: () => this.mostrarModal('error', 'Error', 'No se pudo eliminar el beneficiario.')
        });
      }
    );
  }

  // ===== AGRUPACIÓN CRIPTAS PRIVADAS =====
  agruparCriptas() {
    this.criptasPrivadas = [];
    if (this.parcelaSeleccionada && this.parcelaSeleccionada.criptas) {
      for (const cr of this.parcelaSeleccionada.criptas) {
        const criptaObj: any = {
          id: cr.id,
          fila: cr.fila,
          columna: cr.columna,
          propietario: cr.cliente ? cr.cliente.nombre : 'Sin Propietario',
          clienteObj: cr.cliente || null,
          beneficiariosObj: cr.beneficiarios || [],
          espacios: [],
          mostrarDetalle: false
        };
        if (cr.espacios) {
          for (const esp of cr.espacios) {
            criptaObj.espacios.push({
              id: esp.id,
              numero: esp.numero,
              estado: esp.estado || 'DISPONIBLE',
              difunto: esp.difunto ? esp.difunto.nombre : null,
              difuntoObj: esp.difunto || null
            });
          }
          criptaObj.espacios.sort((a: any, b: any) => a.numero - b.numero);
        }
        this.criptasPrivadas.push(criptaObj);
      }
    }
    this.criptasPrivadas.sort((a, b) => {
      if (a.fila !== b.fila) return a.fila - b.fila;
      return a.columna - b.columna;
    });

    this.filtrarCriptas();
  }

  filtrarCriptas() {
    let filtradas = [...this.criptasPrivadas];

    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase().trim();
      filtradas = filtradas.filter(cr => {
        const prop = (cr.propietario || '').toLowerCase();
        const propDui = (cr.clienteObj?.dui || '').toLowerCase();
        const algunDifunto = cr.espacios.some((e: any) => 
          (e.difunto || '').toLowerCase().includes(termino) ||
          (e.difuntoObj?.dui || '').toLowerCase().includes(termino)
        );
        return prop.includes(termino) || propDui.includes(termino) || algunDifunto;
      });
    }

    if (this.selectedLotePrivadoId) {
      filtradas = filtradas.filter(cr => cr.id == this.selectedLotePrivadoId);
      this.paginaActual = 1;
    }

    this.criptasPrivadasFiltradas = filtradas;
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.lotesPorPagina;
    const fin = inicio + this.lotesPorPagina;
    this.criptasPaginadas = this.criptasPrivadasFiltradas.slice(inicio, fin);
  }

  get totalPaginasPrivado(): number {
    return Math.ceil(this.criptasPrivadasFiltradas.length / this.lotesPorPagina) || 1;
  }

  cambiarPagina(delta: number) {
    const nuevaPagina = this.paginaActual + delta;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginasPrivado) {
      this.paginaActual = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  toggleLoteExpanded(lote: any) {
    lote.expanded = !lote.expanded;
  }

  actualizarLotePrivado() {
    this.filtrarCriptas();
  }

  onSearchInput(event: any) {
    let val = event.target.value;
    if (/^\d/.test(val)) {
      let numStr = val.replace(/\D/g, '');
      if (numStr.length > 9) numStr = numStr.substring(0, 9);
      if (numStr.length > 8) {
        val = numStr.substring(0, 8) + '-' + numStr.substring(8);
      } else {
        val = numStr;
      }
      this.terminoBusqueda = val;
      event.target.value = val;
    } else {
      this.terminoBusqueda = val;
    }
    this.filtrarEspacios();
  }

  filtrarEspacios() {
    if (this.seccionSeleccionada && this.seccionSeleccionada.nombre === 'PRIVADO') {
      this.filtrarCriptas(); return;
    }
    if (!this.terminoBusqueda.trim()) {
      this.espaciosFiltrados = [...this.espaciosAplanados]; return;
    }
    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.espaciosFiltrados = this.espaciosAplanados.filter(item => {
      return (item.difunto || '').toLowerCase().includes(termino) || 
             (item.estado || '').toLowerCase().includes(termino) ||
             (item.difuntoObj?.dui || '').toLowerCase().includes(termino);
    });
  }

  getEspaciosLibres(cr: any): number {
    if (!cr || !cr.espacios) return 0;
    return cr.espacios.filter((e: any) => (e.estado || 'DISPONIBLE') === 'DISPONIBLE').length;
  }

  toggleDetalleCripta(cr: any) {
    cr.mostrarDetalle = !cr.mostrarDetalle;
  }

  // --- Modal genérico ---
  mostrarModal(tipo: 'error' | 'exito' | 'confirmar', titulo: string, mensaje: string, callback?: () => void) {
    this.modal = { visible: true, tipo, titulo, mensaje, confirmarCallback: callback || null };
  }
  cerrarModal() { this.modal.visible = false; }
  confirmarModal() {
    if (this.modal.confirmarCallback) this.modal.confirmarCallback();
    this.cerrarModal();
  }

  // --- Liberar Espacio ---
  liberarEspacio(esp: any) {
    this.mostrarModal('confirmar', 'Liberar Espacio',
      'Se eliminarán los datos del difunto "' + (esp.difunto || '') + '". Los beneficiarios y el dueño se mantendrán. ¿Continuar?',
      () => {
        this.cementerioService.liberarEspacio(esp.id).subscribe({
          next: () => { this.mostrarModal('exito', 'Espacio Liberado', 'El espacio ha sido liberado.'); this.cargarDetalle(); },
          error: () => this.mostrarModal('error', 'Error', 'Hubo un error al liberar el espacio.')
        });
      }
    );
  }

  // --- Ver Datos Completos ---
  abrirModalVerDatos(tipo: 'propietario' | 'beneficiario' | 'difunto', datos: any) {
    this.modalVerDatos = { visible: true, tipo, datos, documentosCargados: [], pagosCargados: [] };
    const entidadId = datos.id;
    if (entidadId) {
      if (tipo === 'propietario') {
        this.cementerioService.getDocumentosPorCliente(entidadId).subscribe(docs => {
          this.modalVerDatos.documentosCargados = docs;
        });
        this.http.get<any[]>(`${environment.apiUrl}/pagos/cliente/${entidadId}`).subscribe(pagos => {
          this.modalVerDatos.pagosCargados = pagos;
        });
      } else if (tipo === 'difunto') {
        let docs = [];
        if (datos.documentosJson) {
          try {
            docs = JSON.parse(datos.documentosJson);
          } catch(e) {}
        }
        this.modalVerDatos.documentosCargados = docs;
        this.http.get<any[]>(`${environment.apiUrl}/pagos/difunto/${entidadId}`).subscribe(pagos => {
          this.modalVerDatos.pagosCargados = pagos;
        });
      }
    }
  }

  registrarPagoModal() {
    this.modalPago = {
      visible: true,
      monto: null,
      concepto: ''
    };
  }

  cerrarModalPago() {
    this.modalPago.visible = false;
  }

  confirmarRegistroPago() {
    if (!this.modalPago.monto || this.modalPago.monto <= 0) {
      this.mostrarModal('error', 'Monto Inválido', 'Debe ingresar un monto válido mayor a 0.');
      return;
    }
    if (!this.modalPago.concepto || this.modalPago.concepto.trim() === '') {
      this.mostrarModal('error', 'Concepto Inválido', 'Debe ingresar el concepto del pago.');
      return;
    }

    const payload: any = {
      monto: this.modalPago.monto,
      concepto: this.modalPago.concepto,
      estado: 'PAGADO'
    };

    if (this.modalVerDatos.tipo === 'propietario') {
      payload.clienteId = this.modalVerDatos.datos.id;
    } else if (this.modalVerDatos.tipo === 'difunto') {
      payload.difuntoId = this.modalVerDatos.datos.id;
    }

    this.http.post<any>(`${environment.apiUrl}/pagos`, payload).subscribe({
      next: (res) => {
        this.modalVerDatos.pagosCargados.push(res);
        this.cerrarModalPago();
        this.mostrarModal('exito', 'Pago Registrado', 'El pago se ha registrado correctamente.');
      },
      error: (err) => {
        console.error(err);
        this.cerrarModalPago();
        this.mostrarModal('error', 'Error', 'No se pudo registrar el pago.');
      }
    });
  }
  
  cerrarModalVerDatos() {
    this.modalVerDatos.visible = false;
  }

  // --- Visualización de Documentos ---
  verDocumentoBase64(doc: any) {
    if (!doc.base64Archivo) {
      this.mostrarModal('error', 'Error', 'El documento no contiene datos válidos.');
      return;
    }
    const win = window.open();
    if (win) {
      win.document.write('<iframe src="' + doc.base64Archivo + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
    }
  }

  descargarDocumentoBase64(doc: any) {
    if (!doc.base64Archivo) return;
    const a = document.createElement('a');
    a.href = doc.base64Archivo;
    a.download = doc.nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  descargarDocumentoPropio(doc: any) {
    if (!doc.data) return;
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

  eliminarDocumento(docId: number) {
    this.mostrarModal('confirmar', 'Eliminar Documento', '¿Está seguro de que desea eliminar este documento? Esta acción no se puede deshacer.', () => {
      this.cementerioService.eliminarDocumento(docId).subscribe({
        next: () => {
          // Removerlo de la lista actual del modal
          this.modalVerDatos.documentosCargados = this.modalVerDatos.documentosCargados.filter(d => d.id !== docId);
          this.mostrarModal('exito', 'Documento Eliminado', 'El documento se ha eliminado correctamente.');
        },
        error: (err) => {
          console.error('Error al eliminar el documento', err);
          this.mostrarModal('error', 'Error', 'Ocurrió un error al intentar eliminar el documento.');
        }
      });
    });
  }

  // --- Editar Espacio ---
  editarEspacio(esp: any) {
    let documentosArray = [];
    if (esp.difuntoObj?.documentosJson) {
      try {
        documentosArray = JSON.parse(esp.difuntoObj.documentosJson);
      } catch(e) {}
    }

    this.editModal = {
      visible: true,
      espacioId: esp.id,
      nombre: esp.difunto || '',
      dui: esp.difuntoObj?.dui || '',
      fechaNacimiento: esp.difuntoObj?.fechaNacimiento || '',
      fechaFallecimiento: esp.difuntoObj?.fechaFallecimiento || '',
      fechaEntierro: esp.difuntoObj?.fechaEntierro || '',
      edad: esp.difuntoObj?.edad || null,
      sexo: esp.difuntoObj?.sexo || '',
      estadoCivil: esp.difuntoObj?.estadoCivil || '',
      causaMuerte: esp.difuntoObj?.causaMuerte || '',
      domicilioFallecido: esp.difuntoObj?.domicilioFallecido || '',
      nombreResponsable: esp.difuntoObj?.nombreResponsable || '',
      duiResponsable: esp.difuntoObj?.duiResponsable || '',
      domicilioResponsable: esp.difuntoObj?.domicilioResponsable || '',
      celularResponsable: esp.difuntoObj?.celularResponsable || '',
      firmasAutorizadas: esp.difuntoObj?.firmasAutorizadas || false,
      horaFallecimiento: esp.difuntoObj?.horaFallecimiento || '',
      horaEntierro: esp.difuntoObj?.horaEntierro || '',
      materialPlaca: 'Base de hierro con letras de bronce',
      medidasPlaca: '40x20 cm',
      tipoDocumentoDifunto: esp.difuntoObj?.tipoDocumentoDifunto || 'DUI',
      documentos: documentosArray,
      difuntoObj: esp.difuntoObj
    };
  }
  cancelarEditar() { this.editModal.visible = false; }

  onEditDifuntoFileSelectedMulti(event: any) {
    const files: FileList = event.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (!file) continue;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const base64 = e.target.result.split(',')[1];
        if (!this.editModal.documentos) this.editModal.documentos = [];
        this.editModal.documentos.push({ nombre: file.name, data: base64 });
      };
      reader.readAsDataURL(file);
    }
  }

  onTipoDocumentoChange() {
    if (this.editModal.tipoDocumentoDifunto === 'PARTIDA') {
      this.editModal.dui = '';
    }
  }

  onPartidaSelected(event: any) {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;
    const file = files.item(0);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const base64 = e.target.result.split(',')[1];
      const idx = this.editModal.documentos.findIndex((d: any) => d.nombre.startsWith('Partida_Nacimiento'));
      if (idx !== -1) {
        this.editModal.documentos.splice(idx, 1);
      }
      this.editModal.documentos.push({ nombre: 'Partida_Nacimiento_' + (this.editModal.nombre ? this.editModal.nombre.replace(/ /g, '_') : 'Difunto') + '_' + file.name, data: base64 });
    };
    reader.readAsDataURL(file);
  }

  onDuiInput(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 9) val = val.substring(0, 9);
    if (val.length > 8) val = val.substring(0, 8) + '-' + val.substring(8);
    this.editModal.dui = val;
    event.target.value = val;
  }

  onDuiResponsableInput(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 9) val = val.substring(0, 9);
    if (val.length > 8) val = val.substring(0, 8) + '-' + val.substring(8);
    this.editModal.duiResponsable = val;
    event.target.value = val;
  }

  onTelefonoInput(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.substring(0, 8);
    this.editModal.celularResponsable = val;
    event.target.value = val;
  }

  calcularEdad() {
    if (this.editModal.fechaNacimiento && this.editModal.fechaFallecimiento) {
      const nac = new Date(this.editModal.fechaNacimiento + 'T00:00:00');
      const fall = new Date(this.editModal.fechaFallecimiento + 'T00:00:00');
      if (fall < nac) {
        this.editModal.edad = '0 días';
        return;
      }
      
      let years = fall.getFullYear() - nac.getFullYear();
      let months = fall.getMonth() - nac.getMonth();
      let days = fall.getDate() - nac.getDate();
      
      if (days < 0) {
        months--;
        const previousMonth = new Date(fall.getFullYear(), fall.getMonth(), 0);
        days += previousMonth.getDate();
      }
      if (months < 0) {
        years--;
        months += 12;
      }
      
      if (years > 0) {
        this.editModal.edad = `${years} año${years > 1 ? 's' : ''}`;
      } else if (months > 0) {
        this.editModal.edad = `${months} mes${months > 1 ? 'es' : ''}`;
      } else {
        this.editModal.edad = `${days} día${days !== 1 ? 's' : ''}`;
      }
    } else {
      this.editModal.edad = '';
    }
  }

  guardarEdicion() {
    if (!this.editModal.nombre || !this.editModal.fechaFallecimiento) {
      this.mostrarModal('error', 'Campos obligatorios', 'El nombre y la fecha de fallecimiento son obligatorios.');
      return;
    }
    
    if (!this.editModal.duiResponsable || this.editModal.duiResponsable.trim() === '') {
      this.mostrarModal('error', 'Campos obligatorios', 'El DUI del responsable es obligatorio.');
      return;
    }
    
    if (!this.editModal.celularResponsable || this.editModal.celularResponsable.trim() === '') {
      this.mostrarModal('error', 'Campos obligatorios', 'El celular del responsable es obligatorio.');
      return;
    }
    
    if ((this.editModal.tipoDocumentoDifunto === 'DUI' || !this.editModal.tipoDocumentoDifunto) && (!this.editModal.dui || this.editModal.dui.trim() === '')) {
      this.mostrarModal('error', 'Campos obligatorios', 'El DUI del difunto es obligatorio cuando es mayor de edad.');
      return;
    }

    const payload = {
      nombre: this.editModal.nombre,
      dui: this.editModal.dui || null,
      fechaNacimiento: this.editModal.fechaNacimiento || null,
      fechaFallecimiento: this.editModal.fechaFallecimiento || null,
      fechaEntierro: this.editModal.fechaEntierro || null,
      edad: this.editModal.edad || null,
      sexo: this.editModal.sexo || null,
      estadoCivil: this.editModal.estadoCivil || null,
      causaMuerte: this.editModal.causaMuerte || null,
      domicilioFallecido: this.editModal.domicilioFallecido || null,
      tipoDocumentoDifunto: this.editModal.tipoDocumentoDifunto || 'DUI',
      nombreResponsable: this.editModal.nombreResponsable || null,
      duiResponsable: this.editModal.duiResponsable || null,
      domicilioResponsable: this.editModal.domicilioResponsable || null,
      celularResponsable: this.editModal.celularResponsable || null,
      firmasAutorizadas: this.editModal.firmasAutorizadas || false,
      horaFallecimiento: this.editModal.horaFallecimiento ? (this.editModal.horaFallecimiento.length === 5 ? this.editModal.horaFallecimiento + ":00" : this.editModal.horaFallecimiento) : null,
      horaEntierro: this.editModal.horaEntierro ? (this.editModal.horaEntierro.length === 5 ? this.editModal.horaEntierro + ":00" : this.editModal.horaEntierro) : null,
      materialPlaca: this.editModal.materialPlaca || null,
      medidasPlaca: this.editModal.medidasPlaca || null,
      documentosJson: (this.editModal.documentos && this.editModal.documentos.length > 0) ? JSON.stringify(this.editModal.documentos) : null
    };
    this.cementerioService.editarEspacio(this.editModal.espacioId!, payload).subscribe({
      next: (res: any) => {
        this.finalizarEditarEspacio();
      },
      error: (err) => {
        console.error('Error del backend:', err);
        let errorMsg = 'Error al actualizar el espacio. Por favor, intente de nuevo.';
        
        if (err.status === 403) {
          errorMsg = 'Error de Seguridad: Su sesión ha expirado o no tiene permisos suficientes. Por favor cierre sesión y vuelva a ingresar.';
        } else if (err.error && typeof err.error === 'string') {
          errorMsg = err.error;
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }

        if (err.error?.error === 'DUI_DUPLICADO' || err.error?.message === 'DUI_DUPLICADO' || (err.error && typeof err.error === 'string' && err.error.includes('DUI_DUPLICADO'))) {
          this.mostrarModal('error', 'DUI Duplicado', 'Atención: El DUI ingresado ya se encuentra registrado en el sistema.');
        } else {
          this.mostrarModal('error', 'Error', errorMsg);
        }
      }
    });
  }

  finalizarEditarEspacio() {
    this.editModal.visible = false; 
    this.mostrarModal('exito', 'Actualizado', 'El difunto ha sido actualizado.'); 
    this.cargarDetalle();
  }

  volver() { this.router.navigate(['/dashboard/cementerios']); }
}
