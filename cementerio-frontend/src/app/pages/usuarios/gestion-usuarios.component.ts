import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { CementerioService } from '../../services/cementerio.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="header-section">
        <div class="header-title-wrapper">
          <div class="icon-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            <h2>Gestión de Usuarios</h2>
          </div>
          <p class="subtitle">Administre los accesos y roles del personal y visitantes</p>
        </div>
        <div class="header-actions">
          <button class="btn-refresh" (click)="cargarUsuarios()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            ACTUALIZAR
          </button>
          <button class="btn-add" (click)="irANuevo()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            NUEVO USUARIO
          </button>
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Usuario / Correo</th>
                <th>Rol</th>
                <th>Sede Asignada</th>
                <th>Estado</th>
                <th class="actions-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of usuarios">
                <td class="user-info">
                  <div class="avatar">{{ u.correo.charAt(0).toUpperCase() }}</div>
                  <span>{{ u.correo }}</span>
                </td>
                <td>
                  <span class="role-badge" [class]="u.rol">{{ u.rol }}</span>
                </td>
                <td>
                  <span class="sede-text">{{ u.cementerio?.nombre || 'Acceso Global' }}</span>
                </td>
                <td>
                  <span class="status-dot active"></span>
                  <span class="status-text">Activo</span>
                </td>
                <td class="actions-cell">
                  <button class="btn-action edit" (click)="editar(u)" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button class="btn-action password" (click)="resetearPassword(u)" title="Restablecer Contraseña">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                  </button>
                  <button class="btn-action delete" (click)="eliminar(u.idUsuario!)" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-state" *ngIf="usuarios.length === 0">
          <p>No se encontraron usuarios registrados.</p>
        </div>
      </div>

      <!-- Modal para editar usuario -->
      <div class="modal-overlay" *ngIf="showEditModal">
        <div class="modal-content">
          <h3>Editar Usuario</h3>
          <div class="form-group">
            <label>Correo Electrónico</label>
            <input type="email" [(ngModel)]="nuevoCorreo" class="modal-input" placeholder="Nuevo correo">
          </div>
          <div class="form-group">
            <label>Rol</label>
            <select [(ngModel)]="nuevoRol" class="modal-input">
              <option value="ADMIN">ADMIN</option>
              <option value="INFORMATICA">INFORMATICA</option>
              <option value="OPERADOR">OPERADOR</option>
              <option value="VISITANTE">VISITANTE</option>
            </select>
          </div>
          <div class="form-group" *ngIf="nuevoRol === 'OPERADOR'">
            <label>Sede Asignada</label>
            <select [(ngModel)]="nuevoCementerioId" class="modal-input">
              <option [ngValue]="null">Ninguno / Global</option>
              <option *ngFor="let c of cementerios" [ngValue]="c.id">{{ c.nombre }}</option>
            </select>
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="cerrarModales()">Cancelar</button>
            <button class="btn-confirm" (click)="confirmarEdicion()">Guardar</button>
          </div>
        </div>
      </div>

      <!-- Modal para restablecer contraseña -->
      <div class="modal-overlay" *ngIf="showPasswordModal">
        <div class="modal-content">
          <h3>Restablecer Contraseña</h3>
          <p>Ingrese la nueva contraseña para <strong>{{ usuarioActual?.correo }}</strong></p>
          <div class="form-group">
            <input type="password" [(ngModel)]="nuevaClave" class="modal-input" placeholder="Nueva contraseña">
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="cerrarModales()">Cancelar</button>
            <button class="btn-confirm" (click)="confirmarPassword()">Actualizar</button>
          </div>
        </div>
      </div>

      <!-- Modal para confirmar eliminación -->
      <div class="modal-overlay" *ngIf="showDeleteModal">
        <div class="modal-content">
          <h3>Confirmar Eliminación</h3>
          <p>¿Está completamente seguro de eliminar este usuario? Esta acción no se puede deshacer.</p>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="cerrarModales()">Cancelar</button>
            <button class="btn-delete" (click)="confirmarEliminacion()">Eliminar</button>
          </div>
        </div>
      </div>

      <!-- Modal para Mensajes de Alerta -->
      <div class="modal-overlay" *ngIf="showAlertModal">
        <div class="modal-content text-center">
          <div class="alert-icon" [ngClass]="alertType">
            <svg *ngIf="alertType === 'success'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <svg *ngIf="alertType === 'error'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
          <h3>{{ alertTitle }}</h3>
          <p>{{ alertMessage }}</p>
          <div class="modal-actions" style="justify-content: center; margin-top: 1.5rem;">
            <button class="btn-confirm" (click)="cerrarAlertModal()">Aceptar</button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .container { padding: 1.5rem; animation: fadeIn 0.5s ease; }
    
    .header-section { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 2rem; 
      border-bottom: 2px solid #f8f9fa;
      padding-bottom: 1.5rem;
    }
    .icon-title { display: flex; align-items: center; gap: 0.8rem; color: var(--text-main); }
    .header-actions { display: flex; gap: 1rem; }
    
    .btn-refresh {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      padding: 0.8rem 1.2rem;
      border-radius: 10px;
      font-weight: 700;
      color: var(--text-main);
      cursor: pointer;
      transition: 0.2s;
    }
    .btn-refresh:hover { background: #e2e8f0; color: var(--text-main); }

    h2 { margin: 0; color: var(--text-main); font-size: 1.8rem; }
    .subtitle { margin: 0.3rem 0 0; color: var(--text-muted); font-size: 0.95rem; }

    .btn-add { 
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      background: #d73387; 
      color: white; 
      border: none; 
      padding: 0.8rem 1.5rem; 
      border-radius: 10px; 
      font-weight: 800; 
      cursor: pointer; 
      transition: 0.3s;
      box-shadow: 0 4px 15px rgba(215, 51, 135, 0.3);
    }
    .btn-add:hover { background: #be2875; transform: translateY(-2px); }

    .table-card { background: var(--card-bg); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid var(--border-color); }
    
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1.2rem; background: var(--table-header-bg); color: var(--text-muted); font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; }
    td { padding: 1.2rem; border-bottom: 1px solid var(--border-table); font-size: 0.95rem; color: var(--text-main); }
    tr:hover { background: var(--hover-bg); }

    .id-cell { font-weight: 700; color: var(--text-muted); }
    .user-info { display: flex; align-items: center; gap: 1rem; font-weight: 600; }
    .avatar { min-width: 32px; width: 32px; height: 32px; background: #fbcfe8; color: #d73387; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: 800; font-size: 0.8rem; }

    .role-badge { padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 800; display: inline-block; }
    .role-badge.ADMIN { background: #fee2e2; color: #991b1b; }
    .role-badge.INFORMATICA { background: #e0f2fe; color: #075985; }
    .role-badge.OPERADOR { background: #fef3c7; color: #92400e; }
    .role-badge.VISITANTE { background: var(--card-bg); color: var(--text-main); }

    .sede-text { color: var(--text-muted); font-size: 0.9rem; font-style: italic; }

    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px; }
    .status-dot.active { background: #22c55e; }
    .status-text { font-size: 0.85rem; font-weight: 600; color: #22c55e; }

    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-action { 
      background: var(--primary-color); 
      border: none; 
      width: 36px; 
      height: 36px; 
      border-radius: 8px; 
      cursor: pointer; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      transition: 0.2s;
      color: white;
    }
    .btn-action:hover { transform: scale(1.1); filter: brightness(1.1); }
    .btn-action.edit { background: #0ea5e9; }
    .btn-action.password { background: #f59e0b; }
    .btn-action.delete { background: #ef4444; }

    .empty-state { padding: 4rem; text-align: center; color: var(--text-muted); }

    /* Estilos de Modal */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center;
      z-index: 1000; animation: fadeIn 0.3s ease;
    }
    .modal-content {
      background: var(--card-bg); padding: 2rem; border-radius: 16px; width: 90%; max-width: 400px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .modal-content h3 { margin-top: 0; color: var(--text-main); margin-bottom: 0.5rem; }
    .modal-content p { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem; }
    .form-group {
      margin-bottom: 1rem;
      text-align: left;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--text-main);
    }
    .modal-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s ease;
      box-sizing: border-box;
    }
    .modal-input:focus { border-color: #d73387; box-shadow: 0 0 0 3px rgba(215,51,135,0.1); }
    .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-cancel {
      background: var(--table-header-bg); color: var(--text-main); border: none; padding: 0.8rem 1.2rem;
      border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;
    }
    .btn-cancel:hover { background: var(--border-table); }
    .btn-confirm {
      background: #0ea5e9; color: white; border: none; padding: 0.8rem 1.2rem;
      border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;
    }
    .btn-confirm:hover { background: #0284c7; }
    .btn-delete {
      background: #ef4444; color: white; border: none; padding: 0.8rem 1.2rem;
      border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s;
    }
    .btn-delete:hover { background: #dc2626; }

    .text-center { text-align: center; }
    .alert-icon { display: flex; justify-content: center; align-items: center; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 1rem; }
    .alert-icon.success { background: #dcfce7; color: #16a34a; }
    .alert-icon.error { background: #fee2e2; color: #ef4444; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* RESPONSIVE MÓVIL */
    @media (max-width: 768px) {
      .container { padding: 1rem; }
      .header-section { flex-direction: column; align-items: flex-start; gap: 1rem; }
      .header-actions { width: 100%; flex-direction: column; gap: 0.8rem; }
      .btn-refresh, .btn-add { width: 100%; justify-content: center; }
      th, td { padding: 0.8rem; font-size: 0.85rem; }
      .avatar { min-width: 28px; width: 28px; height: 28px; font-size: 0.75rem; }
      .btn-action { width: 32px; height: 32px; }
      .btn-action svg { width: 14px; height: 14px; }
    }
  `]
})
export class GestionUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  
  showEditModal = false;
  showPasswordModal = false;
  showDeleteModal = false;
  
  usuarioActual: Usuario | null = null;
  nuevoCorreo = '';
  nuevoRol = '';
  nuevaClave = '';
  nuevoCementerioId: number | null = null;
  idEliminar: number | null = null;
  
  cementerios: any[] = [];

  showAlertModal = false;
  alertTitle = '';
  alertMessage = '';
  alertType: 'success' | 'error' = 'success';

  constructor(
    private usuarioService: UsuarioService,
    private cementerioService: CementerioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarCementerios();
  }

  cargarCementerios() {
    this.cementerioService.getCementerios().subscribe({
      next: (res) => this.cementerios = res,
      error: (err) => console.error('Error cargando cementerios:', err)
    });
  }

  cargarUsuarios() {
    this.usuarioService.getUsuarios().subscribe({
      next: (res) => this.usuarios = res,
      error: (err) => console.error('Error al cargar usuarios:', err)
    });
  }

  irANuevo() {
    this.router.navigate(['/dashboard/nuevo-usuario']);
  }

  cerrarModales() {
    this.showEditModal = false;
    this.showDeleteModal = false;
    this.showPasswordModal = false;
    this.usuarioActual = null;
    this.nuevoCorreo = '';
    this.nuevoRol = '';
    this.nuevaClave = '';
    this.nuevoCementerioId = null;
    this.idEliminar = null;
  }

  mostrarAlerta(title: string, message: string, type: 'success' | 'error') {
    this.alertTitle = title;
    this.alertMessage = message;
    this.alertType = type;
    this.showAlertModal = true;
  }

  cerrarAlertModal() {
    this.showAlertModal = false;
  }

  editar(u: Usuario) {
    this.usuarioActual = u;
    this.nuevoCorreo = u.correo;
    this.nuevoRol = u.rol;
    this.nuevoCementerioId = u.cementerio ? u.cementerio.id : null;
    this.showEditModal = true;
  }

  confirmarEdicion() {
    if (this.usuarioActual && this.nuevoCorreo) {
      const payload: Usuario = {
        idUsuario: this.usuarioActual.idUsuario,
        correo: this.nuevoCorreo,
        rol: this.nuevoRol,
        cementerio: (this.nuevoRol === 'OPERADOR' && this.nuevoCementerioId) ? { id: this.nuevoCementerioId } : null,
        esTemporal: this.usuarioActual.esTemporal
      };
      this.usuarioService.actualizarUsuario(this.usuarioActual.idUsuario!, payload).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.cerrarModales();
          this.mostrarAlerta('¡Éxito!', 'Usuario actualizado exitosamente.', 'success');
        },
        error: (err) => {
          console.error('Error completo al actualizar:', err);
          this.mostrarAlerta('Error', 'No se pudo actualizar el usuario: ' + (err.error?.message || err.message || 'Error desconocido'), 'error');
        }
      });
    } else {
      this.cerrarModales();
    }
  }

  resetearPassword(u: Usuario) {
    this.usuarioActual = u;
    this.nuevaClave = '';
    this.showPasswordModal = true;
  }

  confirmarPassword() {
    if (this.usuarioActual && this.nuevaClave) {
      this.usuarioService.actualizarPassword(this.usuarioActual.idUsuario!, this.nuevaClave, true).subscribe({
        next: () => {
          this.cerrarModales();
          this.mostrarAlerta('¡Éxito!', 'Contraseña actualizada exitosamente.', 'success');
        },
        error: (err) => {
          console.error('Error al actualizar contraseña:', err);
          this.mostrarAlerta('Error', 'No se pudo actualizar la contraseña: ' + (err.error?.message || err.message), 'error');
        }
      });
    }
  }

  eliminar(id: number) {
    this.idEliminar = id;
    this.showDeleteModal = true;
  }

  confirmarEliminacion() {
    if (this.idEliminar !== null) {
      this.usuarioService.eliminarUsuario(this.idEliminar).subscribe({
        next: () => {
          this.usuarios = this.usuarios.filter(u => u.idUsuario !== this.idEliminar);
          this.cerrarModales();
          this.mostrarAlerta('¡Eliminado!', 'El usuario ha sido eliminado.', 'success');
        },
        error: (err) => {
          console.error('Error completo al eliminar:', err);
          this.mostrarAlerta('Error', 'No se pudo eliminar el usuario: ' + (err.error?.message || err.message || 'Error desconocido'), 'error');
        }
      });
    }
  }
}
