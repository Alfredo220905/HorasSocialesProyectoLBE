package com.cementerio.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String dui;
    private String telefono;
    private String direccion;
    private String correo;

    @Column(columnDefinition = "TEXT")
    private String documentosJson;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private List<Documento> documentos;

    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<Pago> pagos;

    @ManyToOne
    @JoinColumn(name = "cementerio_id")
    @JsonIgnore // Evita loops infinitos de JSON
    private Cementerio cementerio;

    @Transient
    public Long getCementerioId() {
        return this.cementerio != null ? this.cementerio.getId() : null;
    }
}
