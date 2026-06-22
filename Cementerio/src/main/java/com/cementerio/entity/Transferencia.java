package com.cementerio.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transferencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "vendedor_id")
    private Cliente vendedor;

    @ManyToOne
    @JoinColumn(name = "comprador_id")
    private Cliente comprador;

    @ManyToOne
    @JoinColumn(name = "cripta_id")
    private Cripta cripta;

    private LocalDate fechaTransferencia;

    private String detalles;

    @ManyToOne
    @JoinColumn(name = "documento_legal_id")
    private Documento documentoLegal;
}
