package com.cementerio.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Espacio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int numero; // 1 - 4

    @Enumerated(EnumType.STRING)
    private EstadoEspacio estado;

    @ManyToOne
    @JoinColumn(name = "cripta_id")
    @JsonIgnore
    private Cripta cripta;

    @OneToOne(mappedBy = "espacio", cascade = CascadeType.ALL)
    private Difunto difunto;
}
