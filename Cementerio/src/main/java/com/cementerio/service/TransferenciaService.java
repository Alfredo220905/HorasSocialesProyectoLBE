package com.cementerio.service;

import com.cementerio.dto.TransferenciaDTO;
import com.cementerio.entity.*;
import com.cementerio.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransferenciaService {

    private final TransferenciaRepository transferenciaRepository;
    private final ClienteRepository clienteRepository;
    private final CriptaRepository criptaRepository;
    private final DocumentoRepository documentoRepository;

    private TransferenciaDTO mapToDTO(Transferencia t) {
        TransferenciaDTO dto = new TransferenciaDTO();
        dto.setId(t.getId());
        if (t.getVendedor() != null) {
            dto.setVendedorId(t.getVendedor().getId());
            dto.setVendedorNombre(t.getVendedor().getNombre());
        }
        if (t.getComprador() != null) {
            dto.setCompradorId(t.getComprador().getId());
            dto.setCompradorNombre(t.getComprador().getNombre());
        }
        if (t.getCripta() != null) dto.setCriptaId(t.getCripta().getId());
        dto.setFechaTransferencia(t.getFechaTransferencia());
        dto.setDetalles(t.getDetalles());
        if (t.getDocumentoLegal() != null) dto.setDocumentoLegalId(t.getDocumentoLegal().getId());
        return dto;
    }

    public List<TransferenciaDTO> listarTodos() {
        return transferenciaRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public TransferenciaDTO realizarTraspaso(TransferenciaDTO dto) {
        Cripta cripta = criptaRepository.findById(dto.getCriptaId())
                .orElseThrow(() -> new RuntimeException("Cripta no encontrada"));

        Cliente vendedor = cripta.getCliente(); // El dueño actual
        if (vendedor == null) {
            throw new RuntimeException("La cripta no tiene un dueño actual para traspasar");
        }

        Cliente comprador;
        if (dto.getCompradorId() != null) {
            comprador = clienteRepository.findById(dto.getCompradorId())
                    .orElseThrow(() -> new RuntimeException("Comprador no encontrado"));
        } else if (dto.getCompradorNombre() != null && !dto.getCompradorNombre().isEmpty()) {
            comprador = new Cliente();
            comprador.setNombre(dto.getCompradorNombre());
            comprador.setDui("S/N");
            comprador = clienteRepository.save(comprador);
        } else {
            throw new RuntimeException("Debe proveer un compradorId o un compradorNombre");
        }

        if (vendedor.getId().equals(comprador.getId())) {
            throw new RuntimeException("El comprador y el vendedor no pueden ser la misma persona");
        }

        // Crear la transferencia histórica
        Transferencia transferencia = new Transferencia();
        transferencia.setVendedor(vendedor);
        transferencia.setComprador(comprador);
        transferencia.setCripta(cripta);
        transferencia.setFechaTransferencia(dto.getFechaTransferencia() != null ? dto.getFechaTransferencia() : LocalDate.now());
        transferencia.setDetalles(dto.getDetalles());

        if (dto.getDocumentoLegalId() != null) {
            Documento doc = documentoRepository.findById(dto.getDocumentoLegalId()).orElse(null);
            transferencia.setDocumentoLegal(doc);
        }

        Transferencia saved = transferenciaRepository.save(transferencia);

        // Cambiar el dueño de la cripta
        cripta.setCliente(comprador);
        criptaRepository.save(cripta);

        return mapToDTO(saved);
    }
}
