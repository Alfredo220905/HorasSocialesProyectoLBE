package com.cementerio.repository;

import com.cementerio.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByDui(String dui);
    boolean existsByDui(String dui);
    boolean existsByDuiAndIdNot(String dui, Long id);
    List<Cliente> findByNombreContainingIgnoreCaseOrDuiContainingIgnoreCase(String nombre, String dui);
}
