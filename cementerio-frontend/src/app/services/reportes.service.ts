import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  private apiUrl = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) { }

  descargarExcelOcupacion(cementerioId?: number | null) {
    let url = `${this.apiUrl}/ocupacion/excel`;
    if (cementerioId) url += `?cementerioId=${cementerioId}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  descargarPdfOcupacion(cementerioId?: number | null) {
    let url = `${this.apiUrl}/ocupacion/pdf`;
    if (cementerioId) url += `?cementerioId=${cementerioId}`;
    return this.http.get(url, { responseType: 'blob' });
  }
}
