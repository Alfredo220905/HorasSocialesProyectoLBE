package com.cementerio.repository;

import com.cementerio.entity.Espacio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EspacioRepository extends JpaRepository<Espacio, Long> {

    @Query("SELECT e FROM Espacio e JOIN e.cripta c JOIN c.parcela p JOIN p.seccion s JOIN s.cementerio cem WHERE cem.id = :cementerioId ORDER BY s.nombre, p.nombre, c.fila, c.columna, e.numero")
    List<Espacio> findByCementerioId(@Param("cementerioId") Long cementerioId);
}
