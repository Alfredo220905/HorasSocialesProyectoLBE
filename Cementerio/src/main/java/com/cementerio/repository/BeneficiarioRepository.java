package com.cementerio.repository;

import com.cementerio.entity.Beneficiario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BeneficiarioRepository extends JpaRepository<Beneficiario, Long> {
    List<Beneficiario> findByCriptaId(Long criptaId);
    boolean existsByDui(String dui);
    boolean existsByDuiAndIdNot(String dui, Long id);
}
