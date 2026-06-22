package com.cementerio.controller;

import com.cementerio.dto.DifuntoDTO;
import com.cementerio.entity.Difunto;
import com.cementerio.service.DifuntoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/difuntos")
@RequiredArgsConstructor
public class DifuntoController {

    private final DifuntoService difuntoService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERADOR')")
    public Difunto registrarDifunto(@RequestBody com.cementerio.dto.DifuntoDTO dto) {
        return difuntoService.registrarDifunto(dto);
    }

    @GetMapping
    public java.util.List<com.cementerio.dto.DifuntoDTO> listar() {
        return difuntoService.listarDifuntos();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERADOR')")
    public Difunto actualizarDifunto(@PathVariable Long id, @RequestBody com.cementerio.dto.DifuntoDTO dto) {
        return difuntoService.actualizarDifunto(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void eliminarDifunto(@PathVariable Long id) {
        difuntoService.eliminarDifunto(id);
    }

    @GetMapping("/buscar")
    public java.util.List<com.cementerio.dto.DifuntoDTO> buscarDifuntos(@RequestParam String query) {
        return difuntoService.buscarDifuntos(query);
    }

    @GetMapping("/cliente/{clienteId}")
    public java.util.List<com.cementerio.dto.DifuntoDTO> listarPorCliente(@PathVariable Long clienteId) {
        return difuntoService.listarPorCliente(clienteId);
    }
}
