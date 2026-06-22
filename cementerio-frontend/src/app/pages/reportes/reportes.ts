import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportesService } from '../../services/reportes.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes {

  loadingExcel = false;
  loadingPdf = false;
  errorMsg = '';

  constructor(private reportesService: ReportesService) {}

  descargarExcel(): void {
    this.loadingExcel = true;
    this.errorMsg = '';
    this.reportesService.descargarExcelOcupacion().subscribe({
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
    this.reportesService.descargarPdfOcupacion().subscribe({
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
