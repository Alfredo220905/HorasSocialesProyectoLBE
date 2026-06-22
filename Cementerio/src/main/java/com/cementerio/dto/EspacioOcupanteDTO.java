package com.cementerio.dto;

import lombok.Data;

@Data
public class EspacioOcupanteDTO {
    private int numero;
    private String estado; // Libre, Ocupado
    private String difuntoNombre;
}
