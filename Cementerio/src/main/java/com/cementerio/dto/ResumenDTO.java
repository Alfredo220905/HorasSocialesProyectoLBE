package com.cementerio.dto;

import lombok.Data;
import java.util.List;

@Data
public class ResumenDTO {
    private long totalCementerios;
    private long totalParcelas;
    private long totalDifuntosPublicos;
    private long totalDifuntosPrivados;
    
    // Estadísticas de estados de los espacios
    private long espaciosDisponibles;
    private long espaciosOcupados;
    private long espaciosMantenimiento;

    private List<DetallePrivado> detallesPrivados;

    @Data
    public static class DetallePrivado {
        private String difunto;
        private String cementerio;
        private String parcela;
        private String propietario;
        private List<String> beneficiarios;
    }
}
