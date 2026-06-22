import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {

  private apiUrl = 'http://localhost:8081/api/reportes';

  constructor(private http: HttpClient) { }

  descargarExcelOcupacion() {
    return this.http.get(`${this.apiUrl}/ocupacion/excel`, { responseType: 'blob' });
  }

  descargarPdfOcupacion() {
    return this.http.get(`${this.apiUrl}/ocupacion/pdf`, { responseType: 'blob' });
  }
}
