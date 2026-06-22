package com.cementerio.controller;

import com.cementerio.dto.CementerioDTO;
import com.cementerio.entity.Cementerio;
import com.cementerio.service.CementerioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cementerios")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class CementerioController {

    private final CementerioService cementerioService;

    @PostMapping
    public Cementerio crearCementerio(@RequestBody CementerioDTO dto) {
        return cementerioService.crearCementerio(
                dto.getNombre(),
                dto.isTienePrivado()
        );
    }

    @GetMapping
    public java.util.List<Cementerio> listarTodos() {
        java.util.List<Cementerio> lista = cementerioService.listarTodos();
        System.out.println("API Cementerios - Enviando lista de tamaño: " + lista.size());
        return lista;
    }

    @GetMapping("/{id}/detalle")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public Cementerio obtenerDetalle(@PathVariable Long id) {
        Cementerio c = cementerioService.obtenerPorId(id);
        // Forzar carga lazy de toda la jerarquía
        if (c.getSecciones() != null) {
            c.getSecciones().forEach(s -> {
                if (s.getParcelas() != null) {
                    s.getParcelas().forEach(p -> {
                        if (p.getCriptas() != null) {
                            p.getCriptas().forEach(cr -> {
                                if (cr.getEspacios() != null) {
                                    cr.getEspacios().size(); // forzar carga
                                }
                            });
                        }
                    });
                }
            });
        }
        return c;
    }

    @GetMapping("/resumen")
    public com.cementerio.dto.ResumenDTO obtenerResumen() {
        return cementerioService.obtenerResumen();
    }

    @PutMapping("/espacios/{id}/liberar")
    public void liberarEspacio(@PathVariable Long id) {
        cementerioService.liberarEspacio(id);
    }

    @PutMapping("/espacios/{id}/editar")
    public com.cementerio.entity.Difunto editarEspacio(@PathVariable Long id, @RequestBody com.cementerio.entity.Difunto difunto) {
        return cementerioService.editarDifuntoDeEspacio(id, difunto);
    }

    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> eliminarCementerio(@PathVariable Long id) {
        cementerioService.eliminarCementerio(id);
        return org.springframework.http.ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/secciones")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public java.util.List<java.util.Map<String, Object>> getSecciones(@PathVariable Long id) {
        return cementerioService.getSeccionesPorCementerio(id).stream()
            .map(s -> {
                java.util.Map<String, Object> map = new java.util.LinkedHashMap<>();
                map.put("id", s.getId());
                map.put("nombre", s.getNombre());
                
                // Cargar parcelas y sus criptas/espacios
                if (s.getParcelas() != null) {
                    s.getParcelas().forEach(p -> {
                        if (p.getCriptas() != null) {
                            p.getCriptas().forEach(cr -> {
                                if (cr.getEspacios() != null) {
                                    cr.getEspacios().size(); // forzar lazy loading
                                }
                                if (cr.getBeneficiarios() != null) {
                                    cr.getBeneficiarios().size(); // forzar lazy loading
                                }
                            });
                        }
                    });
                }
                map.put("parcelas", s.getParcelas());
                return map;
            }).collect(java.util.stream.Collectors.toList());
    }
}

