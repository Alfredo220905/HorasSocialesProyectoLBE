package com.cementerio.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TasaServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String categoria;
    
    @Column(columnDefinition = "TEXT")
    private String concepto;

    private Double precioOficial;

    private Boolean requiereAprobacionMinsal;
}
