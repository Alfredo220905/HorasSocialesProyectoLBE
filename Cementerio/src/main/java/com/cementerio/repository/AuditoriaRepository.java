package com.cementerio.repository;

import com.cementerio.entity.Auditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    
    @Modifying
    @Query("UPDATE Auditoria a SET a.usuario = null WHERE a.usuario.idUsuario = :idUsuario")
    void desvincularUsuario(@Param("idUsuario") Long idUsuario);
}
