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

          <!-- BARRA DE ACCIÓN: Botón Añadir Propietario (Solo PRIVADO) -->
          <div class="section-action-bar" *ngIf="seccionSeleccionada.nombre === 'PRIVADO'">
            <button class="btn-add-owner" (click)="abrirModalPropietario()">
              + Añadir Propietario
            </button>
          </div>

          <!-- Sidebar de Parcelas -->
          <div class="parcelas-sidebar">
            <h3>Parcelas</h3>
            <div class="parcela-list">
              <button 
                *ngFor="let par of seccionSeleccionada.parcelas" 
                class="parcela-btn"
                [class.active]="parcelaSeleccionada?.id === par.id"
                (click)="seleccionarParcela(par)">
                {{ par.nombre }}
              </button>
              <div class="empty-text" *ngIf="seccionSeleccionada.parcelas.length === 0">
                No hay parcelas en esta sección.
              </div>
            </div>
          </div>

          <!-- Información de la Parcela seleccionada -->
          <div class="parcela-detail" *ngIf="parcelaSeleccionada">
            <div class="detail-header">
              <div class="header-text-container">
                <h3>Información de {{ parcelaSeleccionada.nombre }}</h3>
                <p>Datos exclusivos para <strong>{{ cementerio.nombre }}</strong></p>
              </div>
              <div class="search-container">
                <input 
                  type="text" 
                  [(ngModel)]="terminoBusqueda" 
                  placeholder="Buscar difunto, propietario o estado..." 
                  class="search-input"
                  (input)="filtrarEspacios()"
                />
              </div>
            </div>

            <div class="table-card">
              <!-- SELECTOR DE LOTE PÚBLICO -->
              <div class="public-lote-selector" *ngIf="seccionSeleccionada.nombre !== 'PRIVADO' && criptasPublicas.length > 0" style="margin-bottom: 1rem; padding: 1rem; background: #f3f4f6; border-radius: 8px;">
                <label style="font-weight: 600; margin-right: 0.5rem; color: #374151;">Seleccionar Lote:</label>
                <select [(ngModel)]="selectedLotePublicoId" (change)="actualizarLotePublico()" style="padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid #d1d5db; min-width: 250px;">
                  <option *ngFor="let c of criptasPublicas" [value]="c.id">Fila {{ c.fila }} - Columna {{ c.columna }} ({{ c.espacios?.length || 0 }} espacios)</option>
                </select>
              </div>

              <!-- TABLA PÚBLICO -->
              <table *ngIf="seccionSeleccionada.nombre !== 'PRIVADO'">
                <thead>
                  <tr>
                    <th>Lote</th>
                    <th>Espacio</th>
                    <th>Estado</th>
                    <th>Difunto</th>
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

              <!-- TABLA PRIVADO (AGRUPADA) -->
              <table *ngIf="seccionSeleccionada.nombre === 'PRIVADO'">
                <thead>
                  <tr>
                    <th>Dueño / Propietario</th>
                    <th>Cripta / Lote</th>
                    <th>Espacios Totales</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <ng-container *ngFor="let cr of criptasPrivadasFiltradas">
                    <tr>
                      <td class="col-owner">{{ cr.propietario }}</td>
                      <td class="col-cripta">F{{ cr.fila }} - C{{ cr.columna }}</td>
                      <td>{{ cr.espacios.length }} espacios</td>
                      <td>
                        <button class="btn-sm btn-outline" (click)="toggleDetalleCripta(cr)">
                          {{ cr.mostrarDetalle ? 'Ocultar' : 'Ver Más' }}
                        </button>
                      </td>
                    </tr>
                    
                    <tr *ngIf="cr.mostrarDetalle" class="expanded-row">
                      <td colspan="4" class="expanded-cell">
                        <div class="expanded-content">

                          <!-- BENEFICIARIOS E INFORMACIÓN DETALLADA -->
                          <div class="expanded-info-grid">
                            
                            <!-- Columna Propietario y Beneficiarios -->
                            <div class="info-panel-col">
                              <!-- Tarjeta Propietario Titular -->
                              <div class="info-panel">
                                <div class="info-panel-header">
                                  <h4>Propietario Titular</h4>
                                </div>
                                <div class="propietario-card" *ngIf="cr.clienteObj">
                                  <div class="prop-avatar">{{ cr.clienteObj.nombre.charAt(0).toUpperCase() }}</div>
                                  <div class="prop-details">
                                    <div class="prop-name">{{ cr.clienteObj.nombre }}</div>
                                    <div class="prop-info" *ngIf="cr.clienteObj">
                                      <div class="prop-info-item"><span class="label">DUI:</span> {{ cr.clienteObj.dui || 'No registrado' }}</div>
                                      <button class="btn-outline-pink" style="margin-top: 1rem; width: 100%; font-size: 0.85rem;" (click)="abrirModalVerDatos('propietario', cr.clienteObj)">Ver Expediente Completo</button>
                                    </div>
                                  </div>
                                </div>
                                <div *ngIf="!cr.clienteObj" class="empty-state-text">Sin propietario registrado.</div>
                              </div>

                            </div> <!-- Fin Columna Izquierda -->

                            <!-- Columna Espacios y Difuntos -->
                            <div class="info-panel">
                              <div class="info-panel-header">
                                <h4>Espacios y Difuntos</h4>
                              </div>
                              
                              <div class="espacios-grid">
                                <div class="espacio-card" *ngFor="let esp of cr.espacios">
                                  <div class="esp-header">
                                    <span class="esp-number">Espacio {{ esp.numero }}</span>
                                    <span class="status-badge" [ngClass]="(esp.estado || 'DISPONIBLE').toLowerCase()">{{ esp.estado || 'DISPONIBLE' }}</span>
                                  </div>
                                  
                                  <div class="esp-body">
                                    <div *ngIf="esp.difuntoObj" class="difunto-info">
                                      <div class="dif-name">✝ {{ esp.difuntoObj.nombre }}</div>
                                      <div class="dif-dates">
                                        <div *ngIf="esp.difuntoObj.fechaNacimiento"><span class="label">Nacimiento:</span> {{ esp.difuntoObj.fechaNacimiento }}</div>
                                        <div *ngIf="esp.difuntoObj.fechaFallecimiento"><span class="label">Fallecimiento:</span> {{ esp.difuntoObj.fechaFallecimiento }}</div>
                                        <div *ngIf="esp.difuntoObj.fechaEntierro"><span class="label">Entierro:</span> {{ esp.difuntoObj.fechaEntierro }}</div>
                                      </div>
                                    </div>
                                    <div *ngIf="!esp.difuntoObj" class="empty-espacio">
                                      Espacio vacío disponible para uso.
                                    </div>
                                  </div>
                                  
                                  <div class="esp-footer">
                                    <button class="btn-xs btn-outline-pink" (click)="abrirModalVerDatos('difunto', esp.difuntoObj)" *ngIf="esp.difuntoObj">Ver Expediente</button>
                                    <button class="btn-xs btn-outline-pink" (click)="editarEspacio(esp)">Editar Datos</button>
                                    <button class="btn-xs btn-outline-red" (click)="liberarEspacio(esp)" *ngIf="esp.difunto">Liberar Espacio</button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                          </div>
                        </div>
                      </td>
                    </tr>
                  </ng-container>
                  <tr *ngIf="criptasPrivadasFiltradas.length === 0">
                    <td colspan="4" class="text-center">No hay criptas/dueños que coincidan con la búsqueda.</td>
                  </tr>
                </tbody>
              </table>
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
                    Fila {{ cr.fila }} – Col {{ cr.columna }}{{ cr.cliente ? ' ★ ' + cr.cliente.nombre : '' }}
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
              <input type="file" (change)="onPropFileSelected($event)" accept=".pdf,image/*" style="display: block; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.8rem; font-family: inherit; font-size: 0.9rem;">
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
      <div class="modal-overlay" *ngIf="modal.visible" (click)="cerrarModal()">
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
            <h4 style="margin-bottom: 1rem; color: #d63384; font-size: 1rem;">Datos Personales</h4>
            <div class="mp-row-2">
              <div class="form-group">
                <label>Nombre Completo</label>
                <input type="text" [(ngModel)]="editModal.nombre" placeholder="Nombre completo" class="edit-input">
              </div>
              <div class="form-group">
                <label>DUI (No editable)</label>
                <input type="text" [(ngModel)]="editModal.dui" placeholder="00000000-0" class="edit-input" [disabled]="true">
              </div>
            </div>

            <div class="mp-row-3" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-top: 1rem;">
              <div class="form-group">
                <label>Edad</label>
                <input type="number" [(ngModel)]="editModal.edad" class="edit-input">
              </div>
              <div class="form-group">
                <label>Sexo</label>
                <select [(ngModel)]="editModal.sexo" class="edit-input" style="width: 100%;">
                  <option value="">Seleccione</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                </select>
              </div>
              <div class="form-group">
                <label>Estado Civil</label>
                <input type="text" [(ngModel)]="editModal.estadoCivil" class="edit-input">
              </div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
              <label>Domicilio del Fallecido</label>
              <input type="text" [(ngModel)]="editModal.domicilioFallecido" class="edit-input">
            </div>

            <h4 style="margin-top: 1.5rem; margin-bottom: 1rem; color: #d63384; font-size: 1rem;">Datos Médicos y Fallecimiento</h4>
            <div class="mp-row-2">
              <div class="form-group">
                <label>Fecha de Fallecimiento</label>
                <input type="date" [(ngModel)]="editModal.fechaFallecimiento" class="edit-input">
              </div>
              <div class="form-group">
                <label>Hora de Fallecimiento</label>
                <input type="time" [(ngModel)]="editModal.horaFallecimiento" class="edit-input">
              </div>
            </div>

            <div class="mp-row-2" style="margin-top: 1rem;">
              <div class="form-group">
                <label>Causa de Muerte</label>
                <input type="text" [(ngModel)]="editModal.causaMuerte" class="edit-input">
              </div>
              <div class="form-group">
                <label>Fecha de Nacimiento</label>
                <input type="date" [(ngModel)]="editModal.fechaNacimiento" class="edit-input">
              </div>
            </div>

            <h4 style="margin-top: 1.5rem; margin-bottom: 1rem; color: #d63384; font-size: 1rem;">Datos del Responsable</h4>
            <div class="mp-row-2">
              <div class="form-group">
                <label>Nombre del Responsable</label>
                <input type="text" [(ngModel)]="editModal.nombreResponsable" class="edit-input">
              </div>
              <div class="form-group">
                <label>Celular</label>
                <input type="text" [(ngModel)]="editModal.celularResponsable" class="edit-input">
              </div>
            </div>
            <div class="form-group" style="margin-top: 1rem;">
              <label>Domicilio del Responsable</label>
              <input type="text" [(ngModel)]="editModal.domicilioResponsable" class="edit-input">
            </div>

            <h4 style="margin-top: 1.5rem; margin-bottom: 1rem; color: #d63384; font-size: 1rem;">Inhumación</h4>
            <div class="mp-row-2">
              <div class="form-group">
                <label>Fecha de Entierro</label>
                <input type="date" [(ngModel)]="editModal.fechaEntierro" class="edit-input">
              </div>
              <div class="form-group">
                <label>Hora de Entierro</label>
                <input type="time" [(ngModel)]="editModal.horaEntierro" class="edit-input">
              </div>
            </div>
            
            <div class="mp-row-2" style="margin-top: 1rem;">
              <div class="form-group">
                <label>Material Placa</label>
                <input type="text" [(ngModel)]="editModal.materialPlaca" class="edit-input">
              </div>
              <div class="form-group">
                <label>Medidas Placa</label>
                <input type="text" [(ngModel)]="editModal.medidasPlaca" class="edit-input">
              </div>
            </div>

            <div class="form-group" style="margin-top: 1.5rem;">
              <label>Subir Acta / Documento PDF o Imagen</label>
              <input type="file" (change)="onEditDifuntoFileSelected($event)" accept=".pdf,image/*" style="display: block; width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0.8rem; font-family: inherit; font-size: 0.9rem;">
              <p *ngIf="editModal.file.file" style="margin-top: 0.5rem; font-size: 0.85rem; color: #10b981;">Archivo seleccionado: {{ $any(editModal.file.file).name }}</p>
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
          <h3 class="modal-title">Expediente Completo</h3>
          <p class="modal-subtitle" style="margin-bottom: 1.5rem;">Información detallada del {{ modalVerDatos.tipo === 'propietario' ? 'Propietario Titular' : (modalVerDatos.tipo === 'beneficiario' ? 'Beneficiario Autorizado' : 'Difunto Registrado') }}.</p>
          
          <div class="profile-card" *ngIf="modalVerDatos.datos">
            <div class="profile-header" style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
              <div class="profile-avatar" style="width: 60px; height: 60px; border-radius: 50%; background: #fdf2f8; color: #d73387; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold;">
                {{ modalVerDatos.datos.nombre?.charAt(0) | uppercase }}
              </div>
              <div>
                <h4 style="margin: 0; color: #1e293b; font-size: 1.2rem;">{{ modalVerDatos.datos.nombre }}</h4>
                <span style="background: #f1f5f9; color: #475569; padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; margin-top: 0.4rem; display: inline-block;">
                  {{ modalVerDatos.tipo | uppercase }}
                </span>
              </div>
            </div>

            <div class="profile-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; background: #f8fafc; padding: 1.5rem; border-radius: 8px;">
              <div class="detail-item">
                <span style="display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">DUI</span>
                <strong style="color: #334155; font-size: 0.95rem;">{{ modalVerDatos.datos.dui || 'No registrado' }}</strong>
              </div>
              <div class="detail-item" *ngIf="modalVerDatos.tipo === 'propietario'">
                <span style="display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Teléfono</span>
                <strong style="color: #334155; font-size: 0.95rem;">{{ modalVerDatos.datos.telefono || 'No registrado' }}</strong>
              </div>
              <div class="detail-item" *ngIf="modalVerDatos.tipo === 'propietario'">
                <span style="display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Correo Electrónico</span>
                <strong style="color: #334155; font-size: 0.95rem;">{{ modalVerDatos.datos.correo || 'No registrado' }}</strong>
              </div>
              <div class="detail-item" *ngIf="modalVerDatos.tipo === 'difunto'">
                <span style="display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Fecha de Nacimiento</span>
                <strong style="color: #334155; font-size: 0.95rem;">{{ modalVerDatos.datos.fechaNacimiento || 'No registrada' }}</strong>
              </div>
              <div class="detail-item" *ngIf="modalVerDatos.tipo === 'difunto'">
                <span style="display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Fecha de Fallecimiento</span>
                <strong style="color: #334155; font-size: 0.95rem;">{{ modalVerDatos.datos.fechaFallecimiento || 'No registrada' }}</strong>
              </div>
              <div class="detail-item" *ngIf="modalVerDatos.tipo === 'difunto'">
                <span style="display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Fecha de Entierro</span>
                <strong style="color: #334155; font-size: 0.95rem;">{{ modalVerDatos.datos.fechaEntierro || 'No registrada' }}</strong>
              </div>
              <div class="detail-item" *ngIf="modalVerDatos.tipo === 'difunto'">
                <span style="display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem;">Tipo de Registro</span>
                <strong style="color: #334155; font-size: 0.95rem;">{{ modalVerDatos.datos.esPrivado ? 'PRIVADO' : 'PÚBLICO' }}</strong>
              </div>
            </div>

            <div class="profile-docs" *ngIf="(modalVerDatos.tipo === 'propietario' || modalVerDatos.tipo === 'difunto') && modalVerDatos.datos.documentosJson" style="margin-top: 1.5rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem;">
              <span style="display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem;">Anotaciones</span>
              <p style="background: #fff; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 8px; color: #334155; font-size: 0.9rem; margin: 0; white-space: pre-wrap;">{{ modalVerDatos.datos.documentosJson }}</p>
            </div>

            <div class="profile-docs" *ngIf="modalVerDatos.documentosCargados && modalVerDatos.documentosCargados.length > 0" style="margin-top: 1.5rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem;">
              <span style="display: block; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem;">Documentos Adjuntos</span>
              <div *ngFor="let doc of modalVerDatos.documentosCargados" style="display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid #e2e8f0; padding: 0.8rem; border-radius: 8px; margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-size: 1.2rem;">📄</span>
                  <span style="font-size: 0.9rem; color: #334155; font-weight: 500;">{{ doc.nombre }}</span>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <button class="btn-xs btn-outline-pink" (click)="verDocumentoBase64(doc)">Ver</button>
                  <button class="btn-xs btn-outline-pink" (click)="descargarDocumentoBase64(doc)">Descargar</button>
                  <button *ngIf="isAdmin" class="btn-xs btn-outline-red" (click)="eliminarDocumento(doc.id)" title="Eliminar documento">X</button>
                </div>
              </div>
            </div>

            <!-- HISTORIAL DE PAGOS -->
            <div class="profile-docs" *ngIf="modalVerDatos.tipo === 'propietario' || modalVerDatos.tipo === 'difunto'" style="margin-top: 1.5rem; border-top: 1px solid #e2e8f0; padding-top: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                <span style="font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Historial de Pagos</span>
                <button class="btn-xs btn-pay" style="background: #10b981; color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 4px; cursor: pointer;" (click)="registrarPagoModal()">+ Nuevo Pago</button>
              </div>
              
              <div *ngIf="!modalVerDatos.pagosCargados || modalVerDatos.pagosCargados.length === 0" style="text-align: center; color: #94a3b8; font-size: 0.85rem; padding: 1rem 0;">
                No hay pagos registrados
              </div>

              <div *ngFor="let pago of modalVerDatos.pagosCargados" style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.6rem 0.8rem; border-radius: 8px; margin-bottom: 0.5rem; font-size: 0.9rem;">
                <div>
                  <strong style="color: #334155;">{{ pago.concepto }}</strong>
                  <span style="color: #64748b; margin-left: 0.5rem;">{{ pago.fecha }}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <span style="font-family: monospace; font-weight: bold; color: #0f172a;">$ {{ pago.monto }}</span>
                  <span style="padding: 0.2rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: bold;"
                        [ngStyle]="{'background': pago.estado === 'PAGADO' ? '#dcfce7' : '#fee2e2', 'color': pago.estado === 'PAGADO' ? '#16a34a' : '#ef4444'}">
                    {{ pago.estado }}
                  </span>
                </div>
              </div>
            </div>

          </div>

          <div class="modal-actions" style="margin-top: 2rem;">
            <button class="btn-modal btn-cancel" style="width: 100%;" (click)="cerrarModalVerDatos()">Cerrar Expediente</button>
          </div>
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
  espaciosAplanados: any[] = [];
  espaciosFiltrados: any[] = [];

  criptasPrivadas: any[] = [];
  criptasPrivadasFiltradas: any[] = [];

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
    edad: null as number | null,
    sexo: '',
    estadoCivil: '',
    causaMuerte: '',
    domicilioFallecido: '',
    nombreResponsable: '',
    domicilioResponsable: '',
    celularResponsable: '',
    horaFallecimiento: '',
    horaEntierro: '',
    materialPlaca: '',
    medidasPlaca: '',
    documentosJson: '',
    file: { file: null as File | null, base64: '' },
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
    this.criptasPublicas = [];
    this.selectedLotePublicoId = null;
    if (sec.parcelas && sec.parcelas.length > 0) {
      this.seleccionarParcela(sec.parcelas[0]);
    }
  }

  seleccionarParcela(par: any) {
    this.parcelaSeleccionada = par;
    this.terminoBusqueda = '';
    if (this.seccionSeleccionada && this.seccionSeleccionada.nombre === 'PRIVADO') {
      this.agruparCriptas();
    } else {
      this.criptasPublicas = par.criptas || [];
      // Ordenar lotes por fila y columna para el select
      this.criptasPublicas.sort((a, b) => {
        if (a.fila !== b.fila) return a.fila - b.fila;
        return a.columna - b.columna;
      });
      
      if (this.criptasPublicas.length > 0) {
        this.selectedLotePublicoId = this.criptasPublicas[0].id;
      } else {
        this.selectedLotePublicoId = null;
      }
      this.actualizarLotePublico();
    }
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
    if (!this.terminoBusqueda.trim()) {
      this.criptasPrivadasFiltradas = [...this.criptasPrivadas];
      return;
    }
    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.criptasPrivadasFiltradas = this.criptasPrivadas.filter(cr => {
      const prop = (cr.propietario || '').toLowerCase();
      const algunDifunto = cr.espacios.some((e: any) => (e.difunto || '').toLowerCase().includes(termino));
      return prop.includes(termino) || algunDifunto;
    });
  }

  // Metodo aplanarYOrdenarEspacios se reemplaza por actualizarLotePublico,
  // pero lo eliminamos de aquí

  filtrarEspacios() {
    if (this.seccionSeleccionada && this.seccionSeleccionada.nombre === 'PRIVADO') {
      this.filtrarCriptas(); return;
    }
    if (!this.terminoBusqueda.trim()) {
      this.espaciosFiltrados = [...this.espaciosAplanados]; return;
    }
    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.espaciosFiltrados = this.espaciosAplanados.filter(item => {
      return (item.difunto || '').toLowerCase().includes(termino) || (item.estado || '').toLowerCase().includes(termino);
    });
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
        this.cementerioService.getDocumentosPorDifunto(entidadId).subscribe(docs => {
          this.modalVerDatos.documentosCargados = docs;
        });
        this.http.get<any[]>(`${environment.apiUrl}/pagos/difunto/${entidadId}`).subscribe(pagos => {
          this.modalVerDatos.pagosCargados = pagos;
        });
      }
    }
  }

  registrarPagoModal() {
    const montoStr = prompt('Ingrese el monto del pago ($):');
    if (!montoStr) return;
    const monto = parseFloat(montoStr);
    if (isNaN(monto) || monto <= 0) {
      alert('Monto inválido.');
      return;
    }
    const concepto = prompt('Ingrese el concepto (Ej. Mantenimiento Anual):');
    if (!concepto) return;

    const payload: any = {
      monto: monto,
      concepto: concepto,
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
        this.mostrarModal('exito', 'Pago Registrado', 'El pago se ha registrado correctamente.');
      },
      error: (err) => {
        console.error(err);
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

  eliminarDocumento(docId: number) {
    if (!confirm('¿Está seguro de que desea eliminar este documento? Esta acción no se puede deshacer.')) return;
    
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
  }

  // --- Editar Espacio ---
  editarEspacio(esp: any) {
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
      domicilioResponsable: esp.difuntoObj?.domicilioResponsable || '',
      celularResponsable: esp.difuntoObj?.celularResponsable || '',
      horaFallecimiento: esp.difuntoObj?.horaFallecimiento || '',
      horaEntierro: esp.difuntoObj?.horaEntierro || '',
      materialPlaca: esp.difuntoObj?.materialPlaca || '',
      medidasPlaca: esp.difuntoObj?.medidasPlaca || '',
      documentosJson: esp.difuntoObj?.documentosJson || '',
      file: { file: null, base64: '' },
      difuntoObj: esp.difuntoObj
    };
  }
  cancelarEditar() { this.editModal.visible = false; }

  onEditDifuntoFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.editModal.file = { file, base64: e.target.result };
      };
      reader.readAsDataURL(file);
    }
  }

  guardarEdicion() {
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
      nombreResponsable: this.editModal.nombreResponsable || null,
      domicilioResponsable: this.editModal.domicilioResponsable || null,
      celularResponsable: this.editModal.celularResponsable || null,
      horaFallecimiento: this.editModal.horaFallecimiento ? this.editModal.horaFallecimiento + ":00" : null,
      horaEntierro: this.editModal.horaEntierro ? this.editModal.horaEntierro + ":00" : null,
      materialPlaca: this.editModal.materialPlaca || null,
      medidasPlaca: this.editModal.medidasPlaca || null,
      documentosJson: this.editModal.documentosJson || null
    };
    this.cementerioService.editarEspacio(this.editModal.espacioId!, payload).subscribe({
      next: (res: any) => {
        if (this.editModal.file.file && res && res.id) {
          this.cementerioService.subirDocumento(this.editModal.file.file.name, this.editModal.file.base64, undefined, res.id).subscribe({
            next: () => this.finalizarEditarEspacio(),
            error: () => this.finalizarEditarEspacio()
          });
        } else {
          this.finalizarEditarEspacio();
        }
      },
      error: (err) => {
        if (err.error?.error === 'DUI_DUPLICADO' || err.error?.message === 'DUI_DUPLICADO' || (err.error && typeof err.error === 'string' && err.error.includes('DUI_DUPLICADO'))) {
          this.mostrarModal('error', 'DUI Duplicado', 'Atención: El DUI ingresado ya se encuentra registrado en el sistema.');
        } else {
          this.mostrarModal('error', 'Error', 'Error al actualizar el espacio.');
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
