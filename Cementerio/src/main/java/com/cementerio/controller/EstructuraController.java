package com.cementerio.controller;

import com.cementerio.entity.Beneficiario;
import com.cementerio.entity.Cripta;
import com.cementerio.entity.Parcela;
import com.cementerio.service.EstructuraService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/estructura")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class EstructuraController {

    private final EstructuraService estructuraService;

    @PostMapping("/parcela")
    public Parcela agregarParcela(@RequestParam Long seccionId, @RequestParam String nombre) {
        return estructuraService.agregarParcela(seccionId, nombre);
    }

    @PostMapping("/parcela/generar")
    public Parcela generarParcela(@RequestParam Long seccionId,
                                  @RequestParam String nombre,
                                  @RequestParam int filas,
                                  @RequestParam int columnas,
                                  @RequestParam(defaultValue = "4") int espaciosPorLote) {
        return estructuraService.generarParcela(seccionId, nombre, filas, columnas, espaciosPorLote);
    }

    @PostMapping("/lote")
    public ResponseEntity<?> agregarLote(@RequestParam Long parcelaId,
                              @RequestParam int fila,
                              @RequestParam int columna,
                              @RequestParam(required = false) String clienteNombre,
                              @RequestParam(required = false) String clienteDui,
                              @RequestParam(defaultValue = "4") int numEspacios) {
        try {
            Cripta lote = estructuraService.agregarLote(parcelaId, fila, columna, clienteNombre, clienteDui, numEspacios);
            return ResponseEntity.ok(lote);
        } catch (RuntimeException e) {
            if (e.getMessage().startsWith("DUPLICADO")) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/lote/{criptaId}/propietario")
    public Cripta asignarPropietario(@PathVariable Long criptaId,
                                     @RequestParam String dui,
                                     @RequestParam String nombre,
                                     @RequestParam(required = false) String telefono,
                                     @RequestParam(required = false) String correo,
                                     @RequestParam(required = false) String documentosJson) {
        return estructuraService.asignarPropietario(criptaId, dui, nombre, telefono, correo, documentosJson);
    }

    // --- Beneficiarios ---

    @GetMapping("/beneficiarios/{criptaId}")
    public List<Beneficiario> listarBeneficiarios(@PathVariable Long criptaId) {
        return estructuraService.listarBeneficiarios(criptaId);
    }

    @PostMapping("/beneficiarios")
    public Beneficiario agregarBeneficiario(@RequestParam Long criptaId,
                                            @RequestParam String nombre,
                                            @RequestParam(required = false) String dui) {
        return estructuraService.agregarBeneficiario(criptaId, nombre, dui);
    }

    @PutMapping("/beneficiarios/{id}")
    public Beneficiario editarBeneficiario(@PathVariable Long id,
                                            @RequestParam String nombre,
                                            @RequestParam(required = false) String dui) {
        return estructuraService.editarBeneficiario(id, nombre, dui);
    }

    @DeleteMapping("/beneficiarios/{id}")
    public ResponseEntity<?> eliminarBeneficiario(@PathVariable Long id) {
        estructuraService.eliminarBeneficiario(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/parcela/{id}")
    public ResponseEntity<?> eliminarParcela(@PathVariable Long id) {
        estructuraService.eliminarParcela(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/lote/{id}")
    public ResponseEntity<?> eliminarLote(@PathVariable Long id) {
        estructuraService.eliminarLote(id);
        return ResponseEntity.ok().build();
    }
}

