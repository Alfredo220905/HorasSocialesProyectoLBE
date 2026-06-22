import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CambiarPasswordComponent } from './pages/auth/cambiar-password.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ResumenComponent } from './pages/dashboard/resumen.component';
import { CementerioComponent } from './pages/cementerio/cementerio.component';
import { ListaCementeriosComponent } from './pages/cementerio/lista-cementerios.component';
import { DetalleCementerioComponent } from './pages/cementerio/detalle-cementerio.component';
import { NuevoUsuarioComponent } from './pages/usuarios/nuevo-usuario.component';
import { GestionUsuariosComponent } from './pages/usuarios/gestion-usuarios.component';
import { ClientesComponent } from './pages/operaciones/clientes.component';
import { PagosComponent } from './pages/operaciones/pagos.component';
import { DocumentosComponent } from './pages/operaciones/documentos.component';
import { DifuntosComponent } from './pages/operaciones/difuntos.component';
import { CobrosPagosComponent } from './pages/operaciones/cobros-pagos/cobros-pagos.component';

import { BuscarDifuntoComponent } from './pages/consulta/buscar-difunto.component';
import { EstructuraComponent } from './pages/cementerio/estructura.component';
import { authGuard } from './services/auth.guard';

import { Auditoria } from './pages/auditoria/auditoria';
import { Reportes } from './pages/reportes/reportes';
import { Transferencias } from './pages/transferencias/transferencias';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'cambiar-password', component: CambiarPasswordComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard],
    children: [
      { path: 'resumen', component: ResumenComponent },
      { path: 'nuevo-cementerio', component: CementerioComponent },
      { path: 'cementerios', component: ListaCementeriosComponent },
      { path: 'cementerios/:id', component: DetalleCementerioComponent },
      { path: 'nuevo-usuario', component: NuevoUsuarioComponent },
      { path: 'gestion-usuarios', component: GestionUsuariosComponent },
      { path: 'operaciones/difuntos', component: DifuntosComponent },
      { path: 'operaciones/cobros', component: CobrosPagosComponent },

      { path: 'clientes', component: ClientesComponent },
      { path: 'pagos', component: PagosComponent },
      { path: 'documentos', component: DocumentosComponent },
      { path: 'difuntos', component: DifuntosComponent },
      { path: 'buscar-difunto', component: BuscarDifuntoComponent },
      { path: 'estructura', component: EstructuraComponent },

      { path: 'transferencias', component: Transferencias },
      { path: 'auditoria', component: Auditoria },
      { path: 'reportes', component: Reportes },
      { path: '', redirectTo: 'resumen', pathMatch: 'full' }
    ]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
