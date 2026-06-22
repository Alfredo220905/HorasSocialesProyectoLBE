package com.cementerio.repository;

import com.cementerio.entity.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagoRepository extends JpaRepository<Pago, Long> {
    java.util.List<Pago> findByClienteId(Long clienteId);
    java.util.List<Pago> findByDifuntoId(Long difuntoId);
    java.util.List<Pago> findByEstado(com.cementerio.entity.EstadoPago estado);
}
