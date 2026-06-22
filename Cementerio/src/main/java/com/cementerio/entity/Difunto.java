package com.cementerio.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Difunto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String dui;

    private LocalDate fechaFallecimiento;
    private java.time.LocalTime horaFallecimiento;
    private LocalDate fechaNacimiento;
    private LocalDate fechaEntierro;
    private java.time.LocalTime horaEntierro;

    private String correlativo;
    private Integer edad;
    private String sexo;
    private String estadoCivil;
    private String causaMuerte;
    private String domicilioFallecido;
    
    private String nombreResponsable;
    private String domicilioResponsable;
    private String celularResponsable;
    
    @Transient
    private Boolean firmasAutorizadas;

    // Campos de Validaciones
    private Boolean cruzNombreYFecha;
    private String materialPlaca;
    private String medidasPlaca;

    @Column(columnDefinition = "TEXT")
    private String documentosJson;
    
    private Boolean esPrivado;

    @OneToOne
    @JoinColumn(name = "espacio_id")
    @JsonIgnore
    private Espacio espacio;

    @OneToOne
    @JoinColumn(name = "osario_id")
    @JsonIgnore
    private Osario osario;

    @OneToMany(mappedBy = "difunto", cascade = CascadeType.ALL)
    @JsonIgnore
    private java.util.List<Pago> pagos;
}
