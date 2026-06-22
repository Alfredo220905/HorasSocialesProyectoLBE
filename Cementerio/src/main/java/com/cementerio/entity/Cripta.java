package com.cementerio.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cripta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int fila;
    private int columna;

    @ManyToOne
    @JoinColumn(name = "parcela_id")
    @JsonIgnore
    private Parcela parcela;

    @ManyToOne
    @JoinColumn(name = "cliente_id")
    private Cliente cliente; // Dueño del lote/cripta

    @OneToMany(mappedBy = "cripta", cascade = CascadeType.ALL)
    private List<Espacio> espacios;

    @OneToMany(mappedBy = "cripta", cascade = CascadeType.ALL)
    private List<Beneficiario> beneficiarios;
}
