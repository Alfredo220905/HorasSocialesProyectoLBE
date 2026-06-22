package com.cementerio.repository;

import com.cementerio.entity.Seccion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import org.springframework.stereotype.Repository;

@Repository
public interface SeccionRepository extends JpaRepository<Seccion, Long> {
    List<Seccion> findByCementerioId(Long cementerioId);
}
