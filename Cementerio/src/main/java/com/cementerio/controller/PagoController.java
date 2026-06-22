package com.cementerio.controller;

import com.cementerio.dto.PagoDTO;
import com.cementerio.service.PagoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pagos")
@RequiredArgsConstructor
public class PagoController {

    private final PagoService pagoService;

    @GetMapping
    public List<PagoDTO> listarTodos() {
        return pagoService.listarTodos();
    }

    @GetMapping("/pendientes")
    public List<PagoDTO> listarPendientes() {
        return pagoService.listarPendientes();
    }

    @GetMapping("/cliente/{clienteId}")
    public List<PagoDTO> listarPorCliente(@PathVariable Long clienteId) {
        return pagoService.listarPorCliente(clienteId);
    }

    @GetMapping("/difunto/{difuntoId}")
    public List<PagoDTO> listarPorDifunto(@PathVariable Long difuntoId) {
        return pagoService.listarPorDifunto(difuntoId);
    }

    @PostMapping
    public PagoDTO registrarPago(@RequestBody PagoDTO dto) {
        return pagoService.registrarPago(dto);
    }

    @PutMapping("/{id}/estado")
    public PagoDTO cambiarEstado(@PathVariable Long id, @RequestParam String estado) {
        return pagoService.cambiarEstado(id, estado);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        pagoService.eliminar(id);
    }
}
