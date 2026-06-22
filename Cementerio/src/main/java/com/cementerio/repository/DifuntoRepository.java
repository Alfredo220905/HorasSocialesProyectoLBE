package com.cementerio.repository;

import com.cementerio.entity.Difunto;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface DifuntoRepository extends JpaRepository<Difunto, Long> {
    boolean existsByDui(String dui);
    boolean existsByDuiAndIdNot(String dui, Long id);

    List<Difunto> findByNombreContainingIgnoreCaseOrDuiContainingIgnoreCase(String nombre, String dui);

    @Query("SELECT d FROM Difunto d WHERE d.espacio.cripta.cliente.id = :clienteId")
    List<Difunto> findByClienteId(@Param("clienteId") Long clienteId);
}