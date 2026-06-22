package com.cementerio.service;

import com.cementerio.repository.BeneficiarioRepository;
import com.cementerio.repository.ClienteRepository;
import com.cementerio.repository.DifuntoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DuiValidationService {

    private final ClienteRepository clienteRepository;
    private final BeneficiarioRepository beneficiarioRepository;
    private final DifuntoRepository difuntoRepository;

    public void validarDuiUnico(String dui, String tipoEntidad, Long idExcluido) {
        if (dui == null || dui.trim().isEmpty()) {
            return; // DUI opcional en algunos casos
        }

        boolean existeEnCliente = false;
        boolean existeEnBeneficiario = false;
        boolean existeEnDifunto = false;

        if ("CLIENTE".equalsIgnoreCase(tipoEntidad) && idExcluido != null) {
            existeEnCliente = clienteRepository.existsByDuiAndIdNot(dui, idExcluido);
        } else {
            existeEnCliente = clienteRepository.existsByDui(dui);
        }

        if ("BENEFICIARIO".equalsIgnoreCase(tipoEntidad) && idExcluido != null) {
            existeEnBeneficiario = beneficiarioRepository.existsByDuiAndIdNot(dui, idExcluido);
        } else {
            existeEnBeneficiario = beneficiarioRepository.existsByDui(dui);
        }

        if ("DIFUNTO".equalsIgnoreCase(tipoEntidad) && idExcluido != null) {
            existeEnDifunto = difuntoRepository.existsByDuiAndIdNot(dui, idExcluido);
        } else {
            existeEnDifunto = difuntoRepository.existsByDui(dui);
        }

        if (existeEnCliente || existeEnBeneficiario || existeEnDifunto) {
            throw new RuntimeException("DUI_DUPLICADO");
        }
    }
}
