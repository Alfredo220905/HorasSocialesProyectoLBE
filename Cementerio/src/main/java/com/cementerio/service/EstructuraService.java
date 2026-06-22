package com.cementerio.service;

import com.cementerio.entity.*;
import com.cementerio.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EstructuraService {

    private final SeccionRepository seccionRepository;
    private final ParcelaRepository parcelaRepository;
    private final CriptaRepository criptaRepository;
    private final EspacioRepository espacioRepository;
    private final ClienteRepository clienteRepository;
    private final BeneficiarioRepository beneficiarioRepository;
    private final DuiValidationService duiValidationService;

    @Transactional
    public Parcela agregarParcela(Long seccionId, String nombre) {
        Seccion seccion = seccionRepository.findById(seccionId)
                .orElseThrow(() -> new RuntimeException("Sección no encontrada"));
        Parcela parcela = new Parcela();
        parcela.setNombre(nombre);
        parcela.setSeccion(seccion);
        return parcelaRepository.save(parcela);
    }

    @Transactional
    public Parcela generarParcela(Long seccionId, String nombre, int filas, int columnas, int espaciosPorLote) {
        Seccion seccion = seccionRepository.findById(seccionId)
                .orElseThrow(() -> new RuntimeException("Sección no encontrada"));

        Parcela parcela = new Parcela();
        parcela.setNombre(nombre);
        parcela.setSeccion(seccion);
        parcela = parcelaRepository.save(parcela);

        int count = espaciosPorLote > 0 ? espaciosPorLote : 4;

        for (int r = 1; r <= filas; r++) {
            for (int c = 1; c <= columnas; c++) {
                Cripta lote = new Cripta();
                lote.setFila(r);
                lote.setColumna(c);
                lote.setParcela(parcela);
                lote = criptaRepository.save(lote);

                for (int e = 1; e <= count; e++) {
                    Espacio espacio = new Espacio();
                    espacio.setNumero(e);
                    espacio.setCripta(lote);
                    espacioRepository.save(espacio);
                }
            }
        }
        return parcela;
    }

    @Transactional
    public void eliminarParcela(Long parcelaId) {
        if (!parcelaRepository.existsById(parcelaId)) {
            throw new RuntimeException("Parcela no encontrada");
        }
        parcelaRepository.deleteById(parcelaId);
    }

    @Transactional
    public void eliminarLote(Long loteId) {
        if (!criptaRepository.existsById(loteId)) {
            throw new RuntimeException("Lote/Cripta no encontrado");
        }
        criptaRepository.deleteById(loteId);
    }

    @Transactional
    public Cripta agregarLote(Long parcelaId, int fila, int columna, String clienteNombre, String clienteDui, int numEspacios) {
        Parcela parcela = parcelaRepository.findById(parcelaId)
                .orElseThrow(() -> new RuntimeException("Parcela no encontrada"));

        // Validar duplicado de fila+columna en la misma parcela
        if (criptaRepository.existsByParcelaIdAndFilaAndColumna(parcelaId, fila, columna)) {
            throw new RuntimeException("DUPLICADO: Ya existe un lote en Fila " + fila + " Columna " + columna + " en esta parcela.");
        }

        Cripta lote = new Cripta();
        lote.setFila(fila);
        lote.setColumna(columna);
        lote.setParcela(parcela);

        if (clienteNombre != null && !clienteNombre.trim().isEmpty()) {
            Cliente cliente = null;
            if (clienteDui != null && !clienteDui.trim().isEmpty()) {
                cliente = clienteRepository.findByDui(clienteDui).orElse(null);
            }
            if (cliente == null) {
                cliente = new Cliente();
                cliente.setNombre(clienteNombre);
                cliente.setDui(clienteDui);
                cliente = clienteRepository.save(cliente);
            }
            lote.setCliente(cliente);
        }

        Cripta savedLote = criptaRepository.save(lote);

        int cantidadEspacios = numEspacios > 0 ? numEspacios : 4;
        for (int i = 1; i <= cantidadEspacios; i++) {
            Espacio espacio = new Espacio();
            espacio.setNumero(i);
            espacio.setCripta(savedLote);
            espacioRepository.save(espacio);
        }

        return savedLote;
    }

    @Transactional
    public Cripta asignarPropietario(Long criptaId, String dui, String nombre, String telefono, String correo, String documentosJson) {
        Cripta cripta = criptaRepository.findById(criptaId)
                .orElseThrow(() -> new RuntimeException("Cripta no encontrada"));

        Cliente cliente = clienteRepository.findByDui(dui).orElse(new Cliente());
        
        duiValidationService.validarDuiUnico(dui, "CLIENTE", cliente.getId());
        
        cliente.setDui(dui);
        cliente.setNombre(nombre);
        if (telefono != null && !telefono.trim().isEmpty()) cliente.setTelefono(telefono);
        if (correo != null && !correo.trim().isEmpty()) cliente.setCorreo(correo);
        if (documentosJson != null && !documentosJson.trim().isEmpty()) cliente.setDocumentosJson(documentosJson);
        cliente = clienteRepository.save(cliente);

        cripta.setCliente(cliente);
        return criptaRepository.save(cripta);
    }

    // --- Beneficiario CRUD ---

    @Transactional
    public Beneficiario agregarBeneficiario(Long criptaId, String nombre, String dui) {
        Cripta cripta = criptaRepository.findById(criptaId)
                .orElseThrow(() -> new RuntimeException("Cripta no encontrada"));

        // Validar límite de 4 beneficiarios por espacio/cripta
        if (cripta.getBeneficiarios() != null && cripta.getBeneficiarios().size() >= 4) {
            throw new RuntimeException("Cupo de beneficiarios agotado para este espacio");
        }
        
        duiValidationService.validarDuiUnico(dui, "BENEFICIARIO", null);
        
        // Validar límite de 4 beneficiarios
        long cantidadActual = beneficiarioRepository.findByCriptaId(criptaId).size();
        if (cantidadActual >= 4) {
            throw new RuntimeException("No se pueden agregar más de 4 beneficiarios a este lote/cripta.");
        }
        
        Beneficiario b = new Beneficiario();
        b.setDui(dui);
        b.setNombre(nombre);
        b.setCripta(cripta);
        return beneficiarioRepository.save(b);
    }

    @Transactional
    public Beneficiario editarBeneficiario(Long beneficiarioId, String nombre, String dui) {
        Beneficiario b = beneficiarioRepository.findById(beneficiarioId)
                .orElseThrow(() -> new RuntimeException("Beneficiario no encontrado"));
                
        duiValidationService.validarDuiUnico(dui, "BENEFICIARIO", b.getId());
        
        b.setDui(dui);
        b.setNombre(nombre);
        return beneficiarioRepository.save(b);
    }

    @Transactional
    public void eliminarBeneficiario(Long beneficiarioId) {
        if (!beneficiarioRepository.existsById(beneficiarioId)) {
            throw new RuntimeException("Beneficiario no encontrado");
        }
        beneficiarioRepository.deleteById(beneficiarioId);
    }

    public List<Beneficiario> listarBeneficiarios(Long criptaId) {
        return beneficiarioRepository.findByCriptaId(criptaId);
    }
}

