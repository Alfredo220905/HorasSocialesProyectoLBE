import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EspacioOcupanteDTO {
  numero: number;
  estado: string;
  difuntoNombre?: string;
}

export interface DifuntoDTO {
  id: number;
  nombre: string;
  dui?: string;            // DUI propio del difunto
  fechaFallecimiento: string;
  fechaNacimiento: string;
  fechaEntierro: string;
  anosTranscurridos: number;
  ubicacion: string;
  cementerioNombre: string;
  tipoCementerio: string;
  estadoPago: string;
  dueno: string;
  duenoDui: string;
  beneficiarios?: string[];
  requiereRenovacion: boolean;
  
  correlativo?: string;
  edad?: number;
  sexo?: string;
  estadoCivil?: string;
  causaMuerte?: string;
  domicilioFallecido?: string;
  nombreResponsable?: string;
  domicilioResponsable?: string;
  celularResponsable?: string;
  horaFallecimiento?: string;
  horaEntierro?: string;
  firmasAutorizadas?: boolean;
  
  cruzNombreYFecha?: boolean;
  materialPlaca?: string;
  medidasPlaca?: string;
  
  espacioId?: number;
  osarioId?: number;

  companerosCripta?: EspacioOcupanteDTO[];
  documentos?: {nombre: string; data: string}[];
}

@Injectable({
  providedIn: 'root'
})
export class DifuntoService {
  private apiUrl = 'http://localhost:8081/api/difuntos';

  constructor(private http: HttpClient) {}

  getDifuntos(): Observable<DifuntoDTO[]> {
    return this.http.get<DifuntoDTO[]>(this.apiUrl);
  }

  registrarDifunto(difunto: Partial<DifuntoDTO>): Observable<any> {
    return this.http.post<any>(this.apiUrl, difunto);
  }

  actualizarDifunto(id: number, difunto: Partial<DifuntoDTO>): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, difunto);
  }

  eliminarDifunto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  buscarDifuntos(query: string): Observable<DifuntoDTO[]> {
    return this.http.get<DifuntoDTO[]>(`${this.apiUrl}/buscar`, { params: { query } });
  }
}
