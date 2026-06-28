import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ReportesService } from '../../services/reportes.service';
import { AuthService } from '../../services/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes implements OnInit {

  loadingExcel = false;
  loadingPdf = false;
  errorMsg = '';
  
  cementerios: any[] = [];
  cementerioSeleccionado: number | null = null;
  esAdmin = false;

  constructor(private reportesService: ReportesService, private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.esAdmin = this.authService.getUserRole()?.toUpperCase() === 'ADMIN' || this.authService.getUserRole()?.toUpperCase() === 'ADMINISTRADOR';
    if (this.esAdmin) {
      this.http.get<any[]>(`${environment.apiUrl}/cementerios`).subscribe(data => {
        this.cementerios = data;
      });
    } else {
      this.cementerioSeleccionado = this.authService.getCementerioId();
    }
  }

  descargarExcel(): void {
    this.loadingExcel = true;
    this.errorMsg = '';
    this.reportesService.descargarExcelOcupacion(this.cementerioSeleccionado).subscribe({
      next: (blob) => this.descargarArchivo(blob, 'reporte_ocupacion.xlsx'),
      error: (err) => {
        this.errorMsg = 'Error al descargar el archivo Excel.';
        this.loadingExcel = false;
      }
    });
  }

  descargarPdf(): void {
    this.loadingPdf = true;
    this.errorMsg = '';
    this.reportesService.descargarPdfOcupacion(this.cementerioSeleccionado).subscribe({
      next: (blob) => this.descargarArchivo(blob, 'reporte_ocupacion.pdf'),
      error: (err) => {
        this.errorMsg = 'Error al descargar el archivo PDF.';
        this.loadingPdf = false;
      }
    });
  }

  private descargarArchivo(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    this.loadingExcel = false;
    this.loadingPdf = false;
  }
}
