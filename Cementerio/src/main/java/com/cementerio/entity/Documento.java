package com.cementerio.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Documento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    @Enumerated(EnumType.STRING)
    private EstadoDocumento estado;

    @Enumerated(EnumType.STRING)
    private TipoDocumento tipo;

    @Column(columnDefinition = "TEXT")
    private String base64Archivo;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = true)
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "difunto_id", nullable = true)
    private Difunto difunto;
}
