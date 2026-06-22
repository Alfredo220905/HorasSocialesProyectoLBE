package com.cementerio.dto;

import lombok.Data;

@Data
public class DocumentoUploadDTO {
    private Long clienteId;
    private Long difuntoId;
    private String nombre;
    private String base64Archivo;
}
