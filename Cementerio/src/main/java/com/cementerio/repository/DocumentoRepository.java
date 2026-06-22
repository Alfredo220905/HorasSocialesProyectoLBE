package com.cementerio.repository;

import com.cementerio.entity.Documento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentoRepository extends JpaRepository<Documento, Long> {
    java.util.List<Documento> findByClienteId(Long clienteId);
    java.util.List<Documento> findByDifuntoId(Long difuntoId);
}
