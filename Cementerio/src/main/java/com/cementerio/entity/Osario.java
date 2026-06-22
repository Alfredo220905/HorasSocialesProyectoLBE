package com.cementerio.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Osario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String modulo;
    private Integer numero;
    
    private String estado; // DISPONIBLE, OCUPADO

    @OneToOne(mappedBy = "osario", cascade = CascadeType.ALL)
    @JsonIgnore
    private Difunto difunto;
}
