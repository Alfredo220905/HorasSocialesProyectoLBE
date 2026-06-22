package com.cementerio.service;

import com.cementerio.entity.*;
import com.cementerio.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentoService {

    private final DocumentoRepository documentoRepository;
    private final ClienteRepository clienteRepository;
    private final com.cementerio.repository.DifuntoRepository difuntoRepository;

    public List<Documento> listarTodos() {
        return documentoRepository.findAll();
    }

    public List<Documento> listarPorCliente(Long clienteId) {
        return documentoRepository.findByClienteId(clienteId);
    }

    public List<Documento> listarPorDifunto(Long difuntoId) {
        return documentoRepository.findByDifuntoId(difuntoId);
    }

    public Documento crearDocumento(Long clienteId, Long difuntoId, String nombre, String base64Archivo) {
        if (nombre == null || nombre.trim().isEmpty()) {
            throw new RuntimeException("El nombre del documento es obligatorio");
        }

        Documento documento = new Documento();
        documento.setNombre(nombre);
        documento.setEstado(EstadoDocumento.PENDIENTE);
        documento.setBase64Archivo(base64Archivo);

        if (clienteId != null) {
            Cliente cliente = clienteRepository.findById(clienteId)
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
            documento.setCliente(cliente);
        }

        if (difuntoId != null) {
            Difunto difunto = difuntoRepository.findById(difuntoId)
                    .orElseThrow(() -> new RuntimeException("Difunto no encontrado"));
            documento.setDifunto(difunto);
        }

        return documentoRepository.save(documento);
    }

    public Documento completarDocumento(Long documentoId) {
        Documento doc = documentoRepository.findById(documentoId)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));

        doc.setEstado(EstadoDocumento.COMPLETADO);

        return documentoRepository.save(doc);
    }

    public Documento marcarPendiente(Long documentoId) {
        Documento doc = documentoRepository.findById(documentoId)
                .orElseThrow(() -> new RuntimeException("Documento no encontrado"));

        doc.setEstado(EstadoDocumento.PENDIENTE);

        return documentoRepository.save(doc);
    }

    public void eliminar(Long documentoId) {
        if (!documentoRepository.existsById(documentoId)) {
            throw new RuntimeException("Documento no encontrado");
        }
        documentoRepository.deleteById(documentoId);
    }
}
