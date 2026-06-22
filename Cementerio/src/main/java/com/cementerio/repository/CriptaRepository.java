package com.cementerio.repository;

import com.cementerio.entity.Cripta;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

@Repository
public interface CriptaRepository extends JpaRepository<Cripta, Long> {
    boolean existsByParcelaIdAndFilaAndColumna(Long parcelaId, int fila, int columna);
    java.util.List<Cripta> findByClienteId(Long clienteId);
}
