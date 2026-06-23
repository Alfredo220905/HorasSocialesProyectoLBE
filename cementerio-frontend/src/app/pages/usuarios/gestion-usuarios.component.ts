import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule],
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
                <th>ID</th>
                <th>Usuario / Correo</th>
                <th>Rol</th>
                <th>Sede Asignada</th>
                <th>Estado</th>
                <th class="actions-header">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of usuarios">
                <td class="id-cell">#{{ u.idUsuario }}</td>
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
    .icon-title { display: flex; align-items: center; gap: 0.8rem; color: #1e293b; }
    .header-actions { display: flex; gap: 1rem; }
    
    .btn-refresh {
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      padding: 0.8rem 1.2rem;
      border-radius: 10px;
      font-weight: 700;
      color: #475569;
      cursor: pointer;
      transition: 0.2s;
    }
    .btn-refresh:hover { background: #e2e8f0; color: #1e293b; }

    h2 { margin: 0; color: #1e293b; font-size: 1.8rem; }
    .subtitle { margin: 0.3rem 0 0; color: #64748b; font-size: 0.95rem; }

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

    .table-card { background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #f1f5f9; }
    
    table { width: 100%; border-collapse: collapse; text-align: left; }
    th { padding: 1.2rem; background: #f8fafc; color: #64748b; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; }
    td { padding: 1.2rem; border-bottom: 1px solid #f1f5f9; font-size: 0.95rem; color: #334155; }
    tr:hover { background: #fdf2f8; }

    .id-cell { font-weight: 700; color: #94a3b8; }
    .user-info { display: flex; align-items: center; gap: 1rem; font-weight: 600; }
    .avatar { min-width: 32px; width: 32px; height: 32px; background: #fbcfe8; color: #d73387; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: 800; font-size: 0.8rem; }

    .role-badge { padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 800; display: inline-block; }
    .role-badge.ADMIN { background: #fee2e2; color: #991b1b; }
    .role-badge.INFORMATICA { background: #e0f2fe; color: #075985; }
    .role-badge.OPERADOR { background: #fef3c7; color: #92400e; }
    .role-badge.VISITANTE { background: #f1f5f9; color: #475569; }

    .sede-text { color: #64748b; font-size: 0.9rem; font-style: italic; }

    .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px; }
    .status-dot.active { background: #22c55e; }
    .status-text { font-size: 0.85rem; font-weight: 600; color: #22c55e; }

    .actions-cell { display: flex; gap: 0.5rem; }
    .btn-action { 
      background: white; 
      border: 1px solid #e2e8f0; 
      width: 36px; 
      height: 36px; 
      border-radius: 8px; 
      cursor: pointer; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      transition: 0.2s;
      color: #64748b;
    }
    .btn-action.edit:hover { background: #e0f2fe; border-color: #0ea5e9; color: #0ea5e9; }
    .btn-action.password:hover { background: #fef3c7; border-color: #f59e0b; color: #f59e0b; }
    .btn-action.delete:hover { background: #fee2e2; border-color: #ef4444; color: #ef4444; }

    .empty-state { padding: 4rem; text-align: center; color: #94a3b8; }

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

  constructor(
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
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

  editar(u: Usuario) {
    const nuevoCorreo = prompt('Editar correo electrónico de ' + u.correo, u.correo);
    if (nuevoCorreo && nuevoCorreo !== u.correo) {
      this.usuarioService.actualizarUsuario(u.idUsuario!, { ...u, correo: nuevoCorreo }).subscribe({
        next: () => this.cargarUsuarios(),
        error: (err) => alert('Error al actualizar: ' + err.error?.message)
      });
    }
  }

  resetearPassword(u: Usuario) {
    const nuevaClave = prompt('Ingrese la nueva contraseña temporal para ' + u.correo);
    if (nuevaClave) {
      this.usuarioService.actualizarPassword(u.idUsuario!, nuevaClave).subscribe({
        next: () => alert('Contraseña actualizada correctamente.'),
        error: (err) => alert('Error al cambiar contraseña: ' + err.error?.message)
      });
    }
  }

  eliminar(id: number) {
    if (confirm('¿Está completamente seguro de eliminar este usuario? Esta acción no se puede deshacer.')) {
      this.usuarioService.eliminarUsuario(id).subscribe({
        next: () => {
          this.usuarios = this.usuarios.filter(u => u.idUsuario !== id);
        },
        error: (err) => alert('Error al eliminar: ' + err.error?.message)
      });
    }
  }
}
