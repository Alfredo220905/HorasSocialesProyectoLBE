import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Auditoria {
  id: number;
  accion: string;
  detalles: string;
  fechaHora: string;
  usuario: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {

  private apiUrl = `${environment.apiUrl}/auditoria`;

  constructor(private http: HttpClient) { }

  obtenerLogs(): Observable<Auditoria[]> {
    return this.http.get<Auditoria[]>(this.apiUrl);
  }
}
