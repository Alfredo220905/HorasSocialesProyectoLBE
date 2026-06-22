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
        <div>
          <h2>👥 Gestión de Usuarios</h2>
          <p class="subtitle">Administre los accesos y roles del personal y visitantes</p>
        </div>
        <div class="header-actions">
          <button class="btn-refresh" (click)="cargarUsuarios()">🔄 ACTUALIZAR</button>
          <button class="btn-add" (click)="irANuevo()">+ NUEVO USUARIO</button>
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
                  <button class="btn-action edit" (click)="editar(u)" title="Editar">✏️</button>
                  <button class="btn-action password" (click)="resetearPassword(u)" title="Restablecer Contraseña">🔑</button>
                  <button class="btn-action delete" (click)="eliminar(u.idUsuario!)" title="Eliminar">🗑️</button>
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
    .header-actions { display: flex; gap: 1rem; }
    
    .btn-refresh {
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
    .avatar { width: 32px; height: 32px; background: #fbcfe8; color: #d73387; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: 800; font-size: 0.8rem; }

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
    }
    .btn-action.edit:hover { background: #e0f2fe; border-color: #0ea5e9; }
    .btn-action.password:hover { background: #fef3c7; border-color: #f59e0b; }
    .btn-action.delete:hover { background: #fee2e2; border-color: #ef4444; }

    .empty-state { padding: 4rem; text-align: center; color: #94a3b8; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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
