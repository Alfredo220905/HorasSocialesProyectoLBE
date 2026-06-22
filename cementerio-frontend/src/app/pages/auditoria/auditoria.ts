import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaService, Auditoria as AuditoriaModel } from '../../services/auditoria.service';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.css'
})
export class Auditoria implements OnInit {
  logs: AuditoriaModel[] = [];
  filteredLogs: AuditoriaModel[] = [];
  searchTerm: string = '';

  constructor(private auditoriaService: AuditoriaService) {}

  ngOnInit(): void {
    this.cargarLogs();
  }

  cargarLogs(): void {
    this.auditoriaService.obtenerLogs().subscribe({
      next: (data) => {
        // Ordenamos por fecha descendente
        this.logs = data.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
        this.filteredLogs = this.logs;
      },
      error: (err) => {
        console.error('Error al cargar la auditoría', err);
      }
    });
  }

  filtrar(): void {
    if (!this.searchTerm) {
      this.filteredLogs = this.logs;
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredLogs = this.logs.filter(log => 
      log.accion.toLowerCase().includes(term) ||
      log.detalles.toLowerCase().includes(term) ||
      (log.usuario?.correo && log.usuario.correo.toLowerCase().includes(term))
    );
  }
}
