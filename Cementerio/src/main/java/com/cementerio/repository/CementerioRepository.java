package com.cementerio.repository;

import com.cementerio.entity.Cementerio;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CementerioRepository extends JpaRepository<Cementerio, Long> {
}
