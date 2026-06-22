import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CementerioService } from '../../services/cementerio.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-estructura',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estructura.component.html',
  styleUrls: ['./estructura.component.css']
})
export class EstructuraComponent implements OnInit {
  cementerios: any[] = [];
  seccionesDisponibles: any[] = [];
  parcelas: any[] = [];
  criptasDisponibles: any[] = [];

  selectedCementerioId: number | null = null;
  selectedCementerioNombre = '';
  selectedSeccionId: number | null = null;
  selectedSeccionNombre = '';
  selectedParcelaId: number | null = null;
  
  esPrivado = false; // Para sección 1 (Generar Parcela)
  esPrivadoLote = false; // Para sección 2 (Añadir Lote)

  nuevaParcelaNombre = '';
  nuevaFila = 1;
  nuevaColumna = 1;
  numEspacios = 4;
  
  generarFilas = 1;
  generarColumnas = 1;
  generarEspacios = 4;

  duenoDui = '';
  duenoNombre = '';
  duenoTelefono = '';
  duenoCorreo = '';
  
  selectedCriptaIdParaAsignar: number | null = null;

  // Modal state
  modal = {
    visible: false,
    tipo: '' as 'error' | 'exito' | 'confirmar' | 'editar-beneficiario',
    titulo: '',
    mensaje: '',
    confirmarCallback: null as (() => void) | null
  };

  // Beneficiarios modal
  beneficiariosModal = {
    visible: false,
    criptaId: null as number | null,
    lista: [] as any[],
    nuevoNombre: '',
    nuevoDui: '',
    editandoId: null as number | null,
    editNombre: '',
    editDui: ''
  };

  selectedLotes: { [parcelaId: number]: number } = {};

  private apiUrl = 'http://localhost:8081/api/estructura';

  constructor(private cementerioService: CementerioService, private http: HttpClient) {}

  ngOnInit() {
    this.cargarCementerios();
  }

  cargarCementerios() {
    this.cementerioService.getCementerios().subscribe(res => {
      this.cementerios = res;
    });
  }

  onCementerioChange() {
    const c = this.cementerios.find(x => x.id == this.selectedCementerioId);
    if (c) {
      this.selectedCementerioNombre = c.nombre;
      this.seccionesDisponibles = [];
      this.parcelas = [];
      this.selectedSeccionId = null;
      this.selectedSeccionNombre = '';
      this.esPrivado = false;
      // Cargar secciones desde el API usando el nuevo endpoint
      this.http.get<any[]>(`http://localhost:8081/api/cementerios/${c.id}/secciones`).subscribe({
        next: (secciones) => {
          this.seccionesDisponibles = secciones;
        },
        error: () => {
          this.mostrarModal('error', 'Error', 'No se pudieron cargar las secciones del cementerio.');
        }
      });
    }
  }

  onSeccionChange() {
    const sec = this.seccionesDisponibles.find(s => s.id == this.selectedSeccionId);
    if (sec) {
      this.selectedSeccionNombre = sec.nombre;
      this.esPrivado = sec.nombre === 'PRIVADO';
      this.parcelas = sec.parcelas || [];
      this.selectedParcelaId = null;
      this.criptasDisponibles = [];
      this.selectedCriptaIdParaAsignar = null;
      this.selectedLotes = {};
      
      this.parcelas.forEach(p => {
        if (p.criptas && p.criptas.length > 0) {
          this.selectedLotes[p.id] = p.criptas[0].id;
        }
      });
    }
  }

  recargarDatosSeccion() {
    if (!this.selectedCementerioId || !this.selectedSeccionId) return;
    this.http.get<any[]>(`http://localhost:8081/api/cementerios/${this.selectedCementerioId}/secciones`).subscribe({
      next: (secciones) => {
        this.seccionesDisponibles = secciones;
        const sec = this.seccionesDisponibles.find(s => s.id == this.selectedSeccionId);
        if (sec) {
          this.parcelas = sec.parcelas || [];
          
          if (this.selectedParcelaId && !this.parcelas.find(p => p.id == this.selectedParcelaId)) {
            this.selectedParcelaId = null;
          }
          
          this.parcelas.forEach(p => {
            if (p.criptas && p.criptas.length > 0) {
              if (!this.selectedLotes[p.id] || !p.criptas.find((c:any) => c.id == this.selectedLotes[p.id])) {
                this.selectedLotes[p.id] = p.criptas[0].id;
              }
            } else {
              delete this.selectedLotes[p.id];
            }
          });
          
          if (this.selectedParcelaId) {
             const selectedP = this.parcelas.find(x => x.id == this.selectedParcelaId);
             this.criptasDisponibles = selectedP ? (selectedP.criptas || []) : [];
          }
        }
      }
    });
  }

  onParcelaChange() {
    const p = this.parcelas.find(x => x.id == this.selectedParcelaId);
    if (p) {
      this.esPrivadoLote = this.esPrivado;
      this.criptasDisponibles = p.criptas || [];
      this.selectedCriptaIdParaAsignar = null;
    }
  }

  // --- DUI Mask ---
  onDuiInput(event: any) {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 9) val = val.substring(0, 9);
    if (val.length > 8) {
      val = val.substring(0, 8) + '-' + val.substring(8);
    }
    this.duenoDui = val;
    event.target.value = val;
  }

  // --- Generar Parcela Masiva ---
  generarParcela() {
    if (!this.selectedSeccionId || !this.nuevaParcelaNombre) return;

    this.http.post(`${this.apiUrl}/parcela/generar`, null, {
      params: { 
        seccionId: this.selectedSeccionId.toString(), 
        nombre: this.nuevaParcelaNombre,
        filas: this.generarFilas.toString(),
        columnas: this.generarColumnas.toString(),
        espaciosPorLote: this.esPrivado ? "4" : this.generarEspacios.toString()
      }
    }).subscribe({
      next: () => {
        this.mostrarModal('exito', 'Parcela Generada', 'La parcela y sus lotes han sido generados exitosamente.');
        this.nuevaParcelaNombre = '';
        this.cargarCementerios();
        this.recargarDatosSeccion();
      },
      error: () => this.mostrarModal('error', 'Error', 'No se pudo generar la parcela.')
    });
  }

  // --- Crear Parcela (Solo) ---
  crearParcela() {
    if (!this.selectedSeccionId || !this.nuevaParcelaNombre) return;

    this.http.post(`${this.apiUrl}/parcela`, null, {
      params: { seccionId: this.selectedSeccionId.toString(), nombre: this.nuevaParcelaNombre }
    }).subscribe({
      next: () => {
        this.mostrarModal('exito', 'Parcela Creada', 'La parcela "' + this.nuevaParcelaNombre + '" ha sido creada exitosamente.');
        this.nuevaParcelaNombre = '';
        this.cargarCementerios();
        this.recargarDatosSeccion();
      },
      error: () => this.mostrarModal('error', 'Error', 'No se pudo crear la parcela. Intente de nuevo.')
    });
  }

  // --- Crear Lote ---
  crearLote() {
    if (!this.selectedParcelaId) return;

    const params: any = {
      parcelaId: this.selectedParcelaId.toString(),
      fila: this.nuevaFila.toString(),
      columna: this.nuevaColumna.toString()
    };

    if (this.esPrivadoLote) {
      params.numEspacios = "4";
    } else {
      params.numEspacios = this.numEspacios.toString();
    }
    
    if (this.duenoNombre) {
      params.clienteNombre = this.duenoNombre;
    }
    if (this.duenoDui) {
      params.clienteDui = this.duenoDui;
    }

    this.http.post(`${this.apiUrl}/lote`, null, { params, observe: 'response' }).subscribe({
      next: (resp: any) => {
        this.mostrarModal('exito', 'Lote Creado', 'El lote F' + this.nuevaFila + ' - C' + this.nuevaColumna + ' ha sido creado con ' + (this.esPrivadoLote ? "4" : this.numEspacios) + ' espacios.');
        this.nuevaFila++;
        this.cargarCementerios();
        this.recargarDatosSeccion();
      },
      error: (err) => {
        if (err.status === 409) {
          // Duplicado
          const msg = err.error?.error || 'Ya existe un lote en esa posición.';
          this.mostrarModal('error', 'Espacio Ocupado', msg);
        } else {
          this.mostrarModal('error', 'Error', 'No se pudo crear el lote. Intente de nuevo.');
        }
      }
    });
  }

  // --- Asignar Propietario ---
  asignarPropietario() {
    if (!this.selectedCriptaIdParaAsignar || !this.duenoDui || !this.duenoNombre) return;

    const params: any = {
      dui: this.duenoDui,
      nombre: this.duenoNombre
    };
    if (this.duenoTelefono) params.telefono = this.duenoTelefono;
    if (this.duenoCorreo) params.correo = this.duenoCorreo;

    this.http.put(`${this.apiUrl}/lote/${this.selectedCriptaIdParaAsignar}/propietario`, null, { params }).subscribe({
      next: () => {
        this.mostrarModal('exito', 'Dueño Asignado', 'Se ha asignado el propietario correctamente.');
        this.duenoDui = '';
        this.duenoNombre = '';
        this.duenoTelefono = '';
        this.duenoCorreo = '';
        this.selectedCriptaIdParaAsignar = null;
        this.cargarCementerios();
      },
      error: () => this.mostrarModal('error', 'Error', 'No se pudo asignar el propietario.')
    });
  }

  // --- Modal genérico ---
  mostrarModal(tipo: 'error' | 'exito' | 'confirmar', titulo: string, mensaje: string, callback?: () => void) {
    this.modal = {
      visible: true,
      tipo,
      titulo,
      mensaje,
      confirmarCallback: callback || null
    };
  }

  cerrarModal() {
    this.modal.visible = false;
  }

  confirmarModal() {
    if (this.modal.confirmarCallback) {
      this.modal.confirmarCallback();
    }
    this.cerrarModal();
  }

  // --- Beneficiarios Modal ---
  abrirBeneficiariosModal(criptaId: number) {
    this.beneficiariosModal.criptaId = criptaId;
    this.beneficiariosModal.nuevoNombre = '';
    this.beneficiariosModal.nuevoDui = '';
    this.beneficiariosModal.editandoId = null;
    this.beneficiariosModal.visible = true;
    this.cargarBeneficiarios(criptaId);
  }

  cerrarBeneficiariosModal() {
    this.beneficiariosModal.visible = false;
    this.beneficiariosModal.editandoId = null;
  }

  cargarBeneficiarios(criptaId: number) {
    this.http.get<any[]>(`${this.apiUrl}/beneficiarios/${criptaId}`).subscribe({
      next: (lista) => this.beneficiariosModal.lista = lista,
      error: () => this.beneficiariosModal.lista = []
    });
  }

  agregarBeneficiario() {
    if (!this.beneficiariosModal.criptaId || !this.beneficiariosModal.nuevoNombre) return;
    this.http.post(`${this.apiUrl}/beneficiarios`, null, {
      params: {
        criptaId: this.beneficiariosModal.criptaId.toString(),
        nombre: this.beneficiariosModal.nuevoNombre,
        dui: this.beneficiariosModal.nuevoDui || ''
      }
    }).subscribe({
      next: () => {
        this.beneficiariosModal.nuevoNombre = '';
        this.beneficiariosModal.nuevoDui = '';
        this.cargarBeneficiarios(this.beneficiariosModal.criptaId!);
      },
      error: () => this.mostrarModal('error', 'Error', 'No se pudo agregar el beneficiario.')
    });
  }

  iniciarEdicionBeneficiario(ben: any) {
    this.beneficiariosModal.editandoId = ben.id;
    this.beneficiariosModal.editNombre = ben.nombre;
    this.beneficiariosModal.editDui = ben.dui || '';
  }

  cancelarEdicionBeneficiario() {
    this.beneficiariosModal.editandoId = null;
  }

  guardarEdicionBeneficiario(benId: number) {
    this.http.put(`${this.apiUrl}/beneficiarios/${benId}`, null, {
      params: {
        nombre: this.beneficiariosModal.editNombre,
        dui: this.beneficiariosModal.editDui || ''
      }
    }).subscribe({
      next: () => {
        this.beneficiariosModal.editandoId = null;
        this.cargarBeneficiarios(this.beneficiariosModal.criptaId!);
      },
      error: () => this.mostrarModal('error', 'Error', 'No se pudo editar el beneficiario.')
    });
  }

  pedirEliminarBeneficiario(ben: any) {
    this.mostrarModal('confirmar', 'Eliminar Beneficiario',
      'Esta acción eliminará al beneficiario "' + ben.nombre + '" de forma permanente. ¿Desea continuar?',
      () => this.ejecutarEliminarBeneficiario(ben.id)
    );
  }

  ejecutarEliminarBeneficiario(benId: number) {
    this.http.delete(`${this.apiUrl}/beneficiarios/${benId}`).subscribe({
      next: () => {
        this.cargarBeneficiarios(this.beneficiariosModal.criptaId!);
      },
      error: () => this.mostrarModal('error', 'Error', 'No se pudo eliminar el beneficiario.')
    });
  }

  pedirEliminarParcela(p: any) {
    this.mostrarModal('confirmar', 'Eliminar Parcela',
      '¿Está seguro de eliminar la parcela "' + p.nombre + '"? Esto borrará todos sus lotes de forma permanente.',
      () => this.ejecutarEliminarParcela(p.id)
    );
  }

  ejecutarEliminarParcela(parcelaId: number) {
    this.http.delete(`${this.apiUrl}/parcela/${parcelaId}`).subscribe({
      next: () => {
        this.mostrarModal('exito', 'Parcela Eliminada', 'La parcela ha sido eliminada correctamente.');
        this.cargarCementerios();
        this.selectedParcelaId = null;
        this.recargarDatosSeccion();
      },
      error: () => this.mostrarModal('error', 'Error', 'No se pudo eliminar la parcela.')
    });
  }

  pedirEliminarLote(parcela: any) {
    const loteId = this.selectedLotes[parcela.id];
    if (!loteId) {
      this.mostrarModal('error', 'Error', 'Debe seleccionar un lote para eliminar.');
      return;
    }
    const lote = parcela.criptas.find((c: any) => c.id == loteId);
    if (!lote) return;
    
    this.mostrarModal('confirmar', 'Eliminar Lote',
      `¿Está seguro de eliminar el lote F${lote.fila} C${lote.columna} de la parcela "${parcela.nombre}"?`,
      () => this.ejecutarEliminarLote(loteId, parcela.id)
    );
  }

  ejecutarEliminarLote(loteId: number, parcelaId: number) {
    this.http.delete(`${this.apiUrl}/lote/${loteId}`).subscribe({
      next: () => {
        this.mostrarModal('exito', 'Lote Eliminado', 'El lote ha sido eliminado correctamente.');
        this.cargarCementerios();
        this.recargarDatosSeccion();
      },
      error: () => this.mostrarModal('error', 'Error', 'No se pudo eliminar el lote.')
    });
  }

  onBenDuiInput(event: any, field: 'nuevoDui' | 'editDui') {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 9) val = val.substring(0, 9);
    if (val.length > 8) {
      val = val.substring(0, 8) + '-' + val.substring(8);
    }
    (this.beneficiariosModal as any)[field] = val;
    event.target.value = val;
  }
}
