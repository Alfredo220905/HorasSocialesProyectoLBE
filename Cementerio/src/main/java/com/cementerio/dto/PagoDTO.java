package com.cementerio.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PagoDTO {
    private Long id;
    private double monto;
    private LocalDate fecha;
    private String concepto;
    private String estado;
    private Long clienteId;
    private Long difuntoId;
}
