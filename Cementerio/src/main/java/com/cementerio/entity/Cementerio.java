package com.cementerio.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cementerio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    @Column(name = "tiene_privado")
    private Boolean tienePrivado;

    @OneToMany(mappedBy = "cementerio", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Seccion> secciones;
}
