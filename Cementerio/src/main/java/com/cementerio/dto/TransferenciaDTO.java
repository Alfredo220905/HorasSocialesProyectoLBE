package com.cementerio.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class TransferenciaDTO {
    private Long id;
    private Long vendedorId;
    private String vendedorNombre;
    private Long compradorId;
    private String compradorNombre;
    private String compradorDui;
    private Long criptaId;
    private LocalDate fechaTransferencia;
    private String detalles;
    private Long documentoLegalId;
}
