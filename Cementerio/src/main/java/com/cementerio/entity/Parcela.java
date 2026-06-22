package com.cementerio.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Parcela {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    @ManyToOne
    @JoinColumn(name = "seccion_id")
    @JsonIgnore
    private Seccion seccion;

    @OneToMany(mappedBy = "parcela", cascade = CascadeType.ALL)
    private List<Cripta> criptas;
}
