import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PagoDTO {
  id?: number;
  monto: number;
  fecha?: string;
  concepto: string;
  estado: string; // PENDIENTE o PAGADO
  clienteId?: number;
  difuntoId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private apiUrl = 'http://localhost:8081/api/pagos';

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<PagoDTO[]> {
    return this.http.get<PagoDTO[]>(this.apiUrl);
  }

  listarPendientes(): Observable<PagoDTO[]> {
    return this.http.get<PagoDTO[]>(`${this.apiUrl}/pendientes`);
  }

  listarPorCliente(clienteId: number): Observable<PagoDTO[]> {
    return this.http.get<PagoDTO[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  listarPorDifunto(difuntoId: number): Observable<PagoDTO[]> {
    return this.http.get<PagoDTO[]>(`${this.apiUrl}/difunto/${difuntoId}`);
  }

  registrarPago(pago: PagoDTO): Observable<PagoDTO> {
    return this.http.post<PagoDTO>(this.apiUrl, pago);
  }

  cambiarEstado(pagoId: number, estado: string): Observable<PagoDTO> {
    return this.http.put<PagoDTO>(`${this.apiUrl}/${pagoId}/estado?estado=${estado}`, {});
  }

  eliminarPago(pagoId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${pagoId}`);
  }
}
