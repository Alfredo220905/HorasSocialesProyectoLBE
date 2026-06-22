package com.cementerio.controller;

//import com.cementerio.dto.DocumentoDTO;
import com.cementerio.entity.Documento;
import com.cementerio.service.DocumentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.cementerio.dto.DocumentoUploadDTO;

@RestController
@RequestMapping("/api/documentos")
@RequiredArgsConstructor
public class DocumentoController {

    private final DocumentoService documentoService;

    @GetMapping
    public List<Documento> listarDocumentos() {
        return documentoService.listarTodos();
    }

    @GetMapping("/cliente/{clienteId}")
    public List<Documento> listarPorCliente(@PathVariable Long clienteId) {
        return documentoService.listarPorCliente(clienteId);
    }

    @GetMapping("/difunto/{difuntoId}")
    public List<Documento> listarPorDifunto(@PathVariable Long difuntoId) {
        return documentoService.listarPorDifunto(difuntoId);
    }

    @PostMapping
    public Documento crearDocumento(@RequestBody DocumentoUploadDTO dto) {
        return documentoService.crearDocumento(dto.getClienteId(), dto.getDifuntoId(), dto.getNombre(), dto.getBase64Archivo());
    }

    @PutMapping("/{id}/completar")
    public Documento completarDocumento(@PathVariable Long id) {
        return documentoService.completarDocumento(id);
    }

    @PutMapping("/{id}/pendiente")
    public Documento marcarPendiente(@PathVariable Long id) {
        return documentoService.marcarPendiente(id);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        documentoService.eliminar(id);
    }
}
