import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UsuarioService, Usuario } from '../../services/usuario.service';
import { CementerioService } from '../../services/cementerio.service';

@Component({
  selector: 'app-nuevo-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="card">
        <div class="card-header">
          <h2>👤 Registro de Nuevo Usuario</h2>
          <p>Complete los datos para generar el acceso</p>
        </div>

        <div class="form-body">
          <div class="form-group">
            <label>Correo Electrónico</label>
            <input type="email" [(ngModel)]="nuevoUsuario.correo" placeholder="ejemplo@correo.com">
          </div>

          <div class="form-group">
            <label>Rol del Sistema</label>
            <select [(ngModel)]="nuevoUsuario.rol">
              <option value="ADMIN">ADMINISTRADOR</option>
              <option value="OPERADOR">OPERADOR</option>
              <option value="INFORMATICA">INFORMÁTICA</option>
              <option value="VISITANTE">VISITANTE</option>
            </select>
          </div>

          <!-- Selector de Cementerio (Solo para OPERADOR) -->
          <div class="form-group" *ngIf="nuevoUsuario.rol === 'OPERADOR'">
            <label>Asignar Sede (Cementerio)</label>
            <div class="search-box">
              <input type="text" [(ngModel)]="busqueda" (input)="filtrar()" placeholder="Escriba para buscar sede...">
              <div class="results" *ngIf="busqueda && filtrados.length > 0">
                <div class="item" *ngFor="let c of filtrados" (click)="seleccionar(c)">{{ c.nombre }}</div>
              </div>
            </div>
            <div class="selected-info" *ngIf="idSeleccionado">
              Sede seleccionada: <strong>{{ nombreSeleccionado }}</strong>
            </div>
          </div>

          <!-- Sección de Contraseña -->
          <div class="pass-container">
            <div class="pass-label">
              <label>Contraseña Temporal</label>
              <button class="btn-gen" (click)="generarPass()">🎲 GENERAR</button>
            </div>
            <div class="pass-value" [class.generated]="passwordGenerada">
              {{ passwordGenerada || '--- pendiente de generar ---' }}
            </div>
          </div>

          <button class="btn-submit" [disabled]="!esValido()" (click)="guardar()">
            GUARDAR USUARIO
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL DE ÉXITO -->
    <div class="modal-backdrop" *ngIf="mostrarModal">
      <div class="modal-content">
        <div class="modal-header-success">
          <div class="check-circle">✓</div>
          <h3>Usuario Registrado</h3>
        </div>
        <div class="modal-body">
          <div class="data-item"><strong>Correo:</strong> {{ usuarioCreado?.correo }}</div>
          <div class="data-item"><strong>Rol Asignado:</strong> {{ usuarioCreado?.rol }}</div>
          <div class="data-item password-result">
            <p>Contraseña Temporal:</p>
            <code>{{ passwordGenerada }}</code>
          </div>
          <p class="modal-note">Copié la contraseña ahora. Por seguridad no se volverá a mostrar.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-finish" (click)="terminar()">FINALIZAR Y VOLVER</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; display: flex; justify-content: center; background: var(--bg-color); min-height: 80vh; }
    .card { background: var(--card-bg); border-radius: 16px; box-shadow: 0 15px 50px var(--shadow-color); width: 100%; max-width: 500px; overflow: hidden; border: 1px solid var(--border-color); }
    .card-header { background: var(--primary-color); color: white; padding: 2.5rem 2rem; text-align: center; }
    .card-header h2 { margin: 0; font-size: 1.6rem; letter-spacing: 0.5px; }
    .card-header p { margin: 0.5rem 0 0; opacity: 0.9; font-size: 0.95rem; }

    .form-body { padding: 2.5rem; }
    .form-group { margin-bottom: 1.8rem; }
    label { display: block; margin-bottom: 0.6rem; font-weight: 700; color: var(--text-main); font-size: 0.9rem; text-transform: uppercase; }
    input, select { width: 100%; padding: 0.9rem; border: 1.5px solid var(--border-color); border-radius: 10px; font-size: 1rem; transition: 0.2s; background: var(--card-bg); color: var(--text-main); }
    input:focus, select:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(215, 51, 135, 0.1); }

    .search-box { position: relative; }
    .results { position: absolute; top: 100%; left: 0; width: 100%; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; z-index: 20; max-height: 180px; overflow-y: auto; box-shadow: 0 10px 25px var(--shadow-color); }
    .item { padding: 1rem; cursor: pointer; transition: 0.2s; border-bottom: 1px solid var(--border-color); color: var(--text-main); }
    .item:hover { background: var(--bg-color); color: var(--primary-color); font-weight: 600; }
    .selected-info { margin-top: 0.8rem; padding: 0.8rem; background: rgba(34, 197, 94, 0.1); color: #22c55e; border-radius: 8px; font-size: 0.9rem; border: 1px solid rgba(34, 197, 94, 0.2); }

    .pass-container { margin: 2.5rem 0; background: rgba(215, 51, 135, 0.05); padding: 1.8rem; border-radius: 12px; border: 1px solid var(--border-color); }
    .pass-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .btn-gen { background: var(--text-main); color: var(--bg-color); border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 700; font-size: 0.8rem; transition: 0.2s; }
    .btn-gen:hover { opacity: 0.8; transform: scale(1.05); }
    .pass-value { background: var(--bg-color); padding: 1.2rem; border-radius: 8px; text-align: center; font-family: 'Courier New', monospace; color: var(--text-muted); border: 1.5px dashed var(--border-color); font-size: 1.1rem; }
    .pass-value.generated { color: var(--primary-color); font-weight: 800; font-size: 1.6rem; border: 2px solid var(--primary-color); }

    .btn-submit { width: 100%; background: var(--primary-color); color: white; border: none; padding: 1.2rem; border-radius: 12px; font-weight: 800; font-size: 1rem; cursor: pointer; transition: 0.3s; box-shadow: 0 4px 15px rgba(215, 51, 135, 0.3); }
    .btn-submit:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(215, 51, 135, 0.4); }
    .btn-submit:disabled { background: var(--text-muted); box-shadow: none; cursor: not-allowed; opacity: 0.5; }

    /* MODAL */
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 100; backdrop-filter: blur(4px); }
    .modal-content { background: var(--card-bg); border-radius: 20px; width: 95%; max-width: 420px; overflow: hidden; animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); border: 1px solid var(--border-color); }
    .modal-header-success { background: var(--bg-color); padding: 2.5rem; text-align: center; border-bottom: 1px solid var(--border-color); }
    .check-circle { width: 60px; height: 60px; background: #22c55e; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 2rem; margin: 0 auto 1.2rem; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3); }
    .modal-body { padding: 2.5rem; }
    .data-item { margin-bottom: 1.2rem; font-size: 1.05rem; color: var(--text-main); }
    .password-result { background: var(--bg-color); padding: 1.5rem; border-radius: 12px; text-align: center; border: 2px dashed var(--primary-color); margin-top: 1.5rem; }
    .password-result p { margin: 0 0 0.8rem; font-weight: 700; color: var(--text-muted); font-size: 0.85rem; text-transform: uppercase; }
    .password-result code { font-size: 1.8rem; color: var(--primary-color); font-weight: 900; letter-spacing: 1px; }
    .modal-note { color: #ef4444; font-size: 0.85rem; margin-top: 1.5rem; text-align: center; font-weight: 700; }
    .modal-footer { padding: 0 2.5rem 2.5rem; }
    .btn-finish { width: 100%; background: var(--text-main); color: var(--bg-color); border: none; padding: 1.2rem; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.2s; }
    .btn-finish:hover { opacity: 0.9; }

    @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class NuevoUsuarioComponent implements OnInit {
  nuevoUsuario: Usuario = { correo: '', rol: 'VISITANTE' };
  passwordGenerada = '';
  usuarioCreado: Usuario | null = null;
  mostrarModal = false;

  cementerios: any[] = [];
  filtrados: any[] = [];
  busqueda = '';
  idSeleccionado: number | null = null;
  nombreSeleccionado = '';

  constructor(
    private usuarioService: UsuarioService,
    private cementerioService: CementerioService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cementerioService.getCementerios().subscribe(res => {
      this.cementerios = res;
    });
  }

  filtrar() {
    this.filtrados = this.cementerios.filter(c => 
      c.nombre.toLowerCase().includes(this.busqueda.toLowerCase())
    );
  }

  seleccionar(c: any) {
    this.idSeleccionado = c.id;
    this.nombreSeleccionado = c.nombre;
    this.busqueda = '';
    this.filtrados = [];
  }

  generarPass() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.passwordGenerada = pass;
  }

  esValido() {
    if (!this.nuevoUsuario.correo || !this.passwordGenerada) return false;
    if (this.nuevoUsuario.rol === 'OPERADOR' && !this.idSeleccionado) return false;
    return true;
  }

  guardar() {
    // Construimos un objeto limpio para evitar errores de mapeo (Bad Request)
    const payload: any = {
      correo: this.nuevoUsuario.correo,
      rol: this.nuevoUsuario.rol,
      contrasena: this.passwordGenerada,
      esTemporal: true
    };

    if (this.nuevoUsuario.rol === 'OPERADOR' && this.idSeleccionado) {
      payload.cementerio = { id: this.idSeleccionado };
    }

    console.log('Enviando datos al servidor:', payload);

    this.usuarioService.crearUsuario(payload).subscribe({
      next: (res) => {
        this.usuarioCreado = res;
        this.mostrarModal = true;
      },
      error: (err) => {
        console.error('Error detallado:', err);
        const msg = err.error?.message || err.error?.error || 'Error en el formato de datos (Bad Request)';
        alert('Error: ' + msg);
      }
    });
  }

  terminar() {
    this.mostrarModal = false;
    this.router.navigate(['/dashboard/gestion-usuarios']);
  }
}
