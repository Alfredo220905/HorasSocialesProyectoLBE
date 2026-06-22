package com.cementerio.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Seccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre; // PUBLICO o PRIVADO

    @ManyToOne
    @JoinColumn(name = "cementerio_id")
    @JsonIgnore
    private Cementerio cementerio;

    @OneToMany(mappedBy = "seccion", cascade = CascadeType.ALL)
    private List<Parcela> parcelas;
}
