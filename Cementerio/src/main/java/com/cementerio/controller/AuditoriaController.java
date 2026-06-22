package com.cementerio.controller;

import com.cementerio.entity.Auditoria;
import com.cementerio.repository.AuditoriaRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    private final AuditoriaRepository auditoriaRepository;

    public AuditoriaController(AuditoriaRepository auditoriaRepository) {
        this.auditoriaRepository = auditoriaRepository;
    }

    // Solo ADMIN y INFORMATICA pueden ver la auditoría
    @PreAuthorize("hasAnyRole('ADMIN', 'INFORMATICA')")
    @GetMapping
    public List<Auditoria> obtenerLogs() {
        return auditoriaRepository.findAll();
    }
}
