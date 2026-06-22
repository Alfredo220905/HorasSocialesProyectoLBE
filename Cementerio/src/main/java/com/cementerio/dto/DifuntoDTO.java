package com.cementerio.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class DifuntoDTO {
    private Long id;
    private String nombre;
    private String dui; // DUI propio del difunto
    private LocalDate fechaFallecimiento;
    private LocalDate fechaNacimiento;
    private LocalDate fechaEntierro;
    private int anosTranscurridos;
    private String ubicacion; // Parcela, Lote, Fila, Espacio
    private String cementerioNombre; // Nombre del cementerio
    private String tipoCementerio; // Privado / Publico
    private String estadoPago; // Al día / Pendiente
    private String dueno; // Evitamos 'ñ' por compatibilidad
    private String duenoDui; // DUI del dueño
    private List<String> beneficiarios;
    private boolean requiereRenovacion;
    private String correlativo;
    private Integer edad;
    private String sexo;
    private String estadoCivil;
    private String causaMuerte;
    private String domicilioFallecido;
    
    private String nombreResponsable;
    private String domicilioResponsable;
    private String celularResponsable;
    
    private String horaFallecimiento;
    private String horaEntierro;
    private Boolean firmasAutorizadas;

    private Boolean cruzNombreYFecha;
    private String materialPlaca;
    private String medidasPlaca;

    private Long espacioId; // Necesario para el POST (Cripta/Fosa)
    private Long osarioId; // Necesario para el POST (Osario)
    
    private List<EspacioOcupanteDTO> companerosCripta; // Espacios de la misma cripta
    private List<DocumentoAdjuntoDTO> documentos; // Documentos adjuntos
}
