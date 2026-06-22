import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CementerioService {

  private apiUrl = `${environment.apiUrl}/cementerios`;
  private estructuraUrl = `${environment.apiUrl}/estructura`;

  constructor(private http: HttpClient) {}

  crearCementerio(data: any) {
    return this.http.post(this.apiUrl, data);
  }

  getCementerios() {
    return this.http.get<any[]>(this.apiUrl);
  }

  getDetalleCementerio(id: number) {
    return this.http.get<any>(`${this.apiUrl}/${id}/detalle`);
  }

  liberarEspacio(espacioId: number) {
    return this.http.put(`${this.apiUrl}/espacios/${espacioId}/liberar`, {});
  }

  editarEspacio(espacioId: number, difuntoData: any) {
    return this.http.put(`${this.apiUrl}/espacios/${espacioId}/editar`, difuntoData);
  }

  asignarPropietario(criptaId: number, dui: string, nombre: string, telefono?: string, correo?: string, documentosJson?: string) {
    const params: any = { dui, nombre };
    if (telefono) params['telefono'] = telefono;
    if (correo) params['correo'] = correo;
    if (documentosJson) params['documentosJson'] = documentosJson;
    return this.http.put(`${this.estructuraUrl}/lote/${criptaId}/propietario`, null, { params });
  }

  agregarBeneficiario(criptaId: number, nombre: string, dui?: string) {
    const params: any = { criptaId: criptaId.toString(), nombre };
    if (dui) params['dui'] = dui;
    return this.http.post(`${this.estructuraUrl}/beneficiarios`, null, { params });
  }

  editarBeneficiario(benId: number, nombre: string, dui?: string) {
    const params: any = { nombre };
    if (dui) params['dui'] = dui;
    return this.http.put(`${this.estructuraUrl}/beneficiarios/${benId}`, null, { params });
  }

  eliminarBeneficiario(benId: number) {
    return this.http.delete(`${this.estructuraUrl}/beneficiarios/${benId}`);
  }

  // --- Documentos ---
  subirDocumento(nombreArchivo: string, base64Archivo: string, clienteId?: number, difuntoId?: number) {
    const body: any = { nombre: nombreArchivo, base64Archivo };
    if (clienteId) body['clienteId'] = clienteId;
    if (difuntoId) body['difuntoId'] = difuntoId;
    return this.http.post(`${environment.apiUrl}/documentos`, body);
  }

  getDocumentosPorCliente(clienteId: number) {
    return this.http.get<any[]>(`${environment.apiUrl}/documentos/cliente/${clienteId}`);
  }

  getDocumentosPorDifunto(difuntoId: number) {
    return this.http.get<any[]>(`${environment.apiUrl}/documentos/difunto/${difuntoId}`);
  }

  eliminarDocumento(documentoId: number) {
    return this.http.delete(`${environment.apiUrl}/documentos/${documentoId}`);
  }
}


