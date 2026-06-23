import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TransferenciaDTO {
  id?: number;
  vendedorId?: number;
  vendedorNombre?: string;
  compradorId?: number;
  compradorNombre?: string;
  compradorDui?: string;
  criptaId?: number;
  fechaTransferencia?: string;
  detalles?: string;
  documentoLegalId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransferenciaService {
  private apiUrl = `${environment.apiUrl}/transferencias`;

  constructor(private http: HttpClient) {}

  listarTodos(): Observable<TransferenciaDTO[]> {
    return this.http.get<TransferenciaDTO[]>(this.apiUrl);
  }

  realizarTraspaso(transferencia: TransferenciaDTO): Observable<TransferenciaDTO> {
    return this.http.post<TransferenciaDTO>(this.apiUrl, transferencia);
  }
}
