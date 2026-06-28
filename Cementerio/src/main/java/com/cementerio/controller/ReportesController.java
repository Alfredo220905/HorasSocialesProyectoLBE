package com.cementerio.controller;

import com.cementerio.service.AuditoriaService;
import com.cementerio.service.ReportesService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reportes")
public class ReportesController {

    private final ReportesService reportesService;
    private final AuditoriaService auditoriaService;

    public ReportesController(ReportesService reportesService, AuditoriaService auditoriaService) {
        this.reportesService = reportesService;
        this.auditoriaService = auditoriaService;
    }

    // Permitido a operadores y administradores
    @PreAuthorize("hasAnyRole('ADMIN', 'INFORMATICA', 'OPERADOR')")
    @GetMapping("/ocupacion/excel")
    public ResponseEntity<byte[]> descargarExcelOcupacion(Authentication authentication, @org.springframework.web.bind.annotation.RequestParam(required = false) Long cementerioId) {
        byte[] bytes = reportesService.generarReporteOcupacionExcel(cementerioId);
        
        auditoriaService.registrarAccion(authentication.getName(), "REPORTE_DESCARGADO", "Reporte de ocupación en Excel");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=ocupacion.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'INFORMATICA', 'OPERADOR')")
    @GetMapping("/ocupacion/pdf")
    public ResponseEntity<byte[]> descargarPdfOcupacion(Authentication authentication, @org.springframework.web.bind.annotation.RequestParam(required = false) Long cementerioId) {
        byte[] bytes = reportesService.generarReporteOcupacionPdf(cementerioId);

        auditoriaService.registrarAccion(authentication.getName(), "REPORTE_DESCARGADO", "Reporte de ocupación en PDF");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=ocupacion.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }
}
