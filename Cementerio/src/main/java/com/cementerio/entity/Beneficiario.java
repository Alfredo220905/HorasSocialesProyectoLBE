package com.cementerio.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Beneficiario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String dui; // Opcional

    @ManyToOne
    @JoinColumn(name = "cripta_id")
    @JsonIgnore
    private Cripta cripta;
}
