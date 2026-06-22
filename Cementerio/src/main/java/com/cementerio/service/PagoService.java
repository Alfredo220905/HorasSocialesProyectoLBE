package com.cementerio.service;

import com.cementerio.dto.PagoDTO;
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
public class PagoService {

    private final PagoRepository pagoRepository;
    private final ClienteRepository clienteRepository;
    private final DifuntoRepository difuntoRepository;

    private PagoDTO mapToDTO(Pago pago) {
        PagoDTO dto = new PagoDTO();
        dto.setId(pago.getId());
        dto.setMonto(pago.getMonto());
        dto.setFecha(pago.getFecha());
        dto.setConcepto(pago.getConcepto());
        dto.setEstado(pago.getEstado() != null ? pago.getEstado().name() : null);
        if (pago.getCliente() != null) dto.setClienteId(pago.getCliente().getId());
        if (pago.getDifunto() != null) dto.setDifuntoId(pago.getDifunto().getId());
        return dto;
    }

    public List<PagoDTO> listarTodos() {
        return pagoRepository.findAll().stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<PagoDTO> listarPorCliente(Long clienteId) {
        return pagoRepository.findByClienteId(clienteId).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<PagoDTO> listarPorDifunto(Long difuntoId) {
        return pagoRepository.findByDifuntoId(difuntoId).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<PagoDTO> listarPendientes() {
        return pagoRepository.findByEstado(EstadoPago.PENDIENTE).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @Transactional
    public PagoDTO registrarPago(PagoDTO dto) {
        if (dto.getMonto() <= 0) {
            throw new RuntimeException("El monto debe ser mayor que cero");
        }

        Pago pago = new Pago();
        pago.setMonto(dto.getMonto());
        pago.setFecha(dto.getFecha() != null ? dto.getFecha() : LocalDate.now());
        pago.setConcepto(dto.getConcepto());
        pago.setEstado(dto.getEstado() != null && dto.getEstado().equalsIgnoreCase("PENDIENTE") ? EstadoPago.PENDIENTE : EstadoPago.PAGADO);

        if (dto.getClienteId() != null) {
            Cliente cliente = clienteRepository.findById(dto.getClienteId())
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
            pago.setCliente(cliente);
        } else if (dto.getDifuntoId() != null) {
            Difunto difunto = difuntoRepository.findById(dto.getDifuntoId())
                    .orElseThrow(() -> new RuntimeException("Difunto no encontrado"));
            pago.setDifunto(difunto);
            // Si el pago está AL DÍA, reiniciamos el contador de fecha (renovación) del difunto público
            if (pago.getEstado() == EstadoPago.PAGADO) {
                // Renovar 7 años sumando a la fecha actual si ya estaba vencido, o sumando a la fecha de entierro?
                // En realidad solo se guarda el historial, la deuda desaparece si no hay pagos pendientes.
            }
        } else {
            throw new RuntimeException("Debe especificar un Cliente o un Difunto para el pago");
        }

        Pago saved = pagoRepository.save(pago);
        return mapToDTO(saved);
    }

    public PagoDTO cambiarEstado(Long pagoId, String nuevoEstado) {
        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new RuntimeException("Pago no encontrado"));
        pago.setEstado(nuevoEstado.equalsIgnoreCase("PENDIENTE") ? EstadoPago.PENDIENTE : EstadoPago.PAGADO);
        return mapToDTO(pagoRepository.save(pago));
    }

    public void eliminar(Long pagoId) {
        if (!pagoRepository.existsById(pagoId)) {
            throw new RuntimeException("Pago no encontrado");
        }
        pagoRepository.deleteById(pagoId);
    }
}
