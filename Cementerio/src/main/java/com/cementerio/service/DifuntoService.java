package com.cementerio.service;

import com.cementerio.entity.*;
import com.cementerio.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.cementerio.dto.DocumentoAdjuntoDTO;
import com.cementerio.dto.DifuntoDTO;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;

@Service
@RequiredArgsConstructor
public class DifuntoService {

    private final DifuntoRepository difuntoRepository;
    private final EspacioRepository espacioRepository;
    private final OsarioRepository osarioRepository;
    private final DocumentoRepository documentoRepository;
    private final PagoRepository pagoRepository;
    private final DuiValidationService duiValidationService;
    private final UsuarioRepository usuarioRepository;

    private DifuntoDTO mapToDTO(Difunto difunto) {
        DifuntoDTO dto = new DifuntoDTO();
        dto.setId(difunto.getId());
        dto.setNombre(difunto.getNombre());
        dto.setDui(difunto.getDui());
        dto.setFechaFallecimiento(difunto.getFechaFallecimiento());
        dto.setFechaNacimiento(difunto.getFechaNacimiento());
        dto.setFechaEntierro(difunto.getFechaEntierro());
        
        dto.setCorrelativo(difunto.getCorrelativo());
        dto.setEdad(difunto.getEdad());
        dto.setSexo(difunto.getSexo());
        dto.setEstadoCivil(difunto.getEstadoCivil());
        dto.setCausaMuerte(difunto.getCausaMuerte());
        dto.setDomicilioFallecido(difunto.getDomicilioFallecido());
        dto.setNombreResponsable(difunto.getNombreResponsable());
        dto.setDomicilioResponsable(difunto.getDomicilioResponsable());
        dto.setCelularResponsable(difunto.getCelularResponsable());
        dto.setHoraFallecimiento(difunto.getHoraFallecimiento() != null ? difunto.getHoraFallecimiento().toString() : null);
        dto.setHoraEntierro(difunto.getHoraEntierro() != null ? difunto.getHoraEntierro().toString() : null);
        dto.setFirmasAutorizadas(difunto.getFirmasAutorizadas());
        dto.setCruzNombreYFecha(difunto.getCruzNombreYFecha());
        dto.setMaterialPlaca(difunto.getMaterialPlaca());
        dto.setMedidasPlaca(difunto.getMedidasPlaca());

        if (difunto.getDocumentosJson() != null && !difunto.getDocumentosJson().isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                dto.setDocumentos(mapper.readValue(difunto.getDocumentosJson(), new com.fasterxml.jackson.core.type.TypeReference<List<DocumentoAdjuntoDTO>>() {}));
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        // Cálculo de tiempo
        int anos = 0;
        if (difunto.getFechaFallecimiento() != null) {
            anos = java.time.Period.between(difunto.getFechaFallecimiento(), LocalDate.now()).getYears();
        }
        dto.setAnosTranscurridos(anos);
        dto.setRequiereRenovacion(anos >= 7);

        // Ubicación
        if (difunto.getEspacio() != null && difunto.getEspacio().getCripta() != null) {
            var cripta = difunto.getEspacio().getCripta();
            var parcela = cripta.getParcela();
            dto.setUbicacion(String.format("Parcela: %s, Lote: %d, Fila: %d, Espacio: %d", 
                parcela.getNombre(), cripta.getColumna(), cripta.getFila(), difunto.getEspacio().getNumero()));
            
            if (parcela.getSeccion() != null && parcela.getSeccion().getCementerio() != null) {
                dto.setCementerioNombre(parcela.getSeccion().getCementerio().getNombre());
            }

            if (cripta.getCliente() != null) {
                dto.setDueno(cripta.getCliente().getNombre());
                dto.setDuenoDui(cripta.getCliente().getDui());
                dto.setTipoCementerio("Privado");
                boolean tienePendiente = cripta.getCliente().getPagos() != null && cripta.getCliente().getPagos().stream()
                    .anyMatch(p -> p.getEstado() != null && p.getEstado().name().equals("PENDIENTE"));
                dto.setEstadoPago(tienePendiente ? "PENDIENTE" : "AL DÍA");
            } else {
                dto.setDueno("PÚBLICO / SIN DUEÑO");
                dto.setTipoCementerio("Público");
                dto.setEstadoPago("N/A");
            }
        } else if (difunto.getOsario() != null) {
            dto.setUbicacion(String.format("Osario Módulo: %s, Número: %d", difunto.getOsario().getModulo(), difunto.getOsario().getNumero()));
            dto.setTipoCementerio("Osario");
            dto.setDueno("PÚBLICO");
            dto.setEstadoPago("N/A");
        }

        return dto;
    }

    public List<DifuntoDTO> listarDifuntos() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return List.of();
        }
        
        Usuario currentUser = usuarioRepository.findByCorreo(auth.getName()).orElse(null);
        boolean isAdminOrVisitante = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_ADMINISTRADOR") || a.getAuthority().equals("ROLE_VISITANTE"));
        
        return difuntoRepository.findAll().stream()
                .map(this::mapToDTO)
                .filter(dto -> {
                    if (isAdminOrVisitante) return true;
                    if (currentUser != null && currentUser.getCementerio() != null) {
                        return currentUser.getCementerio().getNombre().equals(dto.getCementerioNombre());
                    }
                    return false;
                })
                .collect(Collectors.toList());
    }

    public List<DifuntoDTO> listarPorCliente(Long clienteId) {
        return difuntoRepository.findByClienteId(clienteId).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public Difunto registrarDifunto(DifuntoDTO dto) {
        Difunto difunto = new Difunto();
        return procesarDifunto(difunto, dto);
    }

    @org.springframework.transaction.annotation.Transactional
    public Difunto actualizarDifunto(Long id, DifuntoDTO dto) {
        Difunto difunto = difuntoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Difunto no encontrado"));
        return procesarDifunto(difunto, dto);
    }

    private Difunto procesarDifunto(Difunto difunto, DifuntoDTO dto) {
        duiValidationService.validarDuiUnico(dto.getDui(), "DIFUNTO", difunto.getId());
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario currentUser = null;
        boolean isAdmin = false;
        if (auth != null && auth.isAuthenticated()) {
            currentUser = usuarioRepository.findByCorreo(auth.getName()).orElse(null);
            isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_ADMINISTRADOR"));
        }
        
        difunto.setNombre(dto.getNombre());
        difunto.setDui(dto.getDui());
        difunto.setFechaFallecimiento(dto.getFechaFallecimiento());
        difunto.setFechaNacimiento(dto.getFechaNacimiento());
        difunto.setFechaEntierro(dto.getFechaEntierro());
        
        difunto.setCorrelativo(dto.getCorrelativo());
        difunto.setEdad(dto.getEdad());
        difunto.setSexo(dto.getSexo());
        difunto.setEstadoCivil(dto.getEstadoCivil());
        difunto.setCausaMuerte(dto.getCausaMuerte());
        difunto.setDomicilioFallecido(dto.getDomicilioFallecido());
        difunto.setNombreResponsable(dto.getNombreResponsable());
        difunto.setDomicilioResponsable(dto.getDomicilioResponsable());
        difunto.setCelularResponsable(dto.getCelularResponsable());
        difunto.setFirmasAutorizadas(dto.getFirmasAutorizadas());
        
        if (dto.getHoraFallecimiento() != null && !dto.getHoraFallecimiento().isEmpty()) {
            difunto.setHoraFallecimiento(LocalTime.parse(dto.getHoraFallecimiento()));
        }
        if (dto.getHoraEntierro() != null && !dto.getHoraEntierro().isEmpty()) {
            difunto.setHoraEntierro(LocalTime.parse(dto.getHoraEntierro()));
        }

        // Asignación de ubicación y Validaciones (Solo si se envía un ID de espacio/osario nuevo)
        if (dto.getOsarioId() != null) {
            Osario osario = osarioRepository.findById(dto.getOsarioId())
                    .orElseThrow(() -> new RuntimeException("Osario no encontrado"));
            
            if (!isAdmin && currentUser != null && currentUser.getCementerio() != null) {
                // Los osarios actualmente no tienen relación con Cementerio en el modelo
                // Si en el futuro se añade, se validará aquí.
            }
            

            // Validar Placa Osario
            if (!"Aluminio".equalsIgnoreCase(dto.getMaterialPlaca()) || !"25x10 cm".equalsIgnoreCase(dto.getMedidasPlaca())) {
                throw new RuntimeException("VALIDACIÓN RECHAZADA: La placa para Osarios debe ser estrictamente de 'Aluminio' y medir '25x10 cm'.");
            }
            
            difunto.setMaterialPlaca(dto.getMaterialPlaca());
            difunto.setMedidasPlaca(dto.getMedidasPlaca());
            difunto.setOsario(osario);
            difunto.setEspacio(null);
            difunto.setEsPrivado(false);

            osario.setEstado("OCUPADO");
            osarioRepository.save(osario);
            
        } else if (dto.getEspacioId() != null) {
            Espacio espacio = espacioRepository.findById(dto.getEspacioId())
                    .orElseThrow(() -> new RuntimeException("Espacio no encontrado"));
            
            if (!isAdmin && currentUser != null && currentUser.getCementerio() != null) {
                if (espacio.getCripta() != null && espacio.getCripta().getParcela() != null && espacio.getCripta().getParcela().getSeccion() != null) {
                    if (!espacio.getCripta().getParcela().getSeccion().getCementerio().getId().equals(currentUser.getCementerio().getId())) {
                        throw new RuntimeException("No tiene permisos para operar en este cementerio");
                    }
                }
            }

            if (espacio.getDifunto() != null && !espacio.getDifunto().getId().equals(difunto.getId())) {
                throw new RuntimeException("El espacio ya está ocupado");
            }

            boolean esPrivado = espacio.getCripta() != null && espacio.getCripta().getCliente() != null;
            difunto.setEsPrivado(esPrivado);

            if (esPrivado) {
                // JARDÍN (Privado)
                if (!"Base de hierro con letras de bronce".equalsIgnoreCase(dto.getMaterialPlaca()) || !"40x20 cm".equalsIgnoreCase(dto.getMedidasPlaca())) {
                    throw new RuntimeException("VALIDACIÓN RECHAZADA: La placa para Cementerio Jardín debe ser de 'Base de hierro con letras de bronce' y medir '40x20 cm'.");
                }
                
                // Regla de Oro: Cliente al día
                Cliente dueño = espacio.getCripta().getCliente();
                boolean tieneDeuda = pagoRepository.findByClienteId(dueño.getId()).stream()
                                     .anyMatch(p -> p.getEstado() == EstadoPago.PENDIENTE);
                if (tieneDeuda) {
                    throw new RuntimeException("VALIDACIÓN RECHAZADA: El propietario del lote tiene cuotas de mantenimiento PENDIENTES. Debe solventarlas antes de la inhumación.");
                }
                
                difunto.setMaterialPlaca(dto.getMaterialPlaca());
                difunto.setMedidasPlaca(dto.getMedidasPlaca());

            } else {
                // GENERAL (Público)
                if (Boolean.TRUE.equals(dto.getCruzNombreYFecha()) == false) {
                    throw new RuntimeException("VALIDACIÓN RECHAZADA: Para el Cementerio General es OBLIGATORIO confirmar la colocación de 'Cruz con Nombre y Fecha'. No se permiten bóvedas de cemento.");
                }
                difunto.setCruzNombreYFecha(true);
            }

            difunto.setEspacio(espacio);
            espacio.setEstado(EstadoEspacio.OCUPADO);
            espacioRepository.save(espacio);
            
        } else if (difunto.getId() == null) {
            throw new RuntimeException("Debe asignar un Espacio o un Osario para el nuevo difunto.");
        }

        if (dto.getDocumentos() != null) {
            try {
                if (dto.getDocumentos().isEmpty()) {
                    difunto.setDocumentosJson(null);
                } else {
                    ObjectMapper mapper = new ObjectMapper();
                    difunto.setDocumentosJson(mapper.writeValueAsString(dto.getDocumentos()));
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return difuntoRepository.save(difunto);
    }

    @org.springframework.transaction.annotation.Transactional
    public void eliminarDifunto(Long id) {
        Difunto difunto = difuntoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Difunto no encontrado"));

        if (difunto.getEspacio() != null) {
            Espacio espacio = difunto.getEspacio();
            espacio.setEstado(EstadoEspacio.DISPONIBLE);
            espacio.setDifunto(null);
            espacioRepository.save(espacio);
        }
        
        if (difunto.getOsario() != null) {
            Osario osario = difunto.getOsario();
            osario.setEstado("DISPONIBLE");
            osarioRepository.save(osario);
        }

        difuntoRepository.delete(difunto);
    }

    public List<DifuntoDTO> buscarDifuntos(String query) {
        String queryLower = query.toLowerCase();
        return listarDifuntos().stream()
                .filter(d -> (d.getNombre() != null && d.getNombre().toLowerCase().contains(queryLower)) || 
                             (d.getDui() != null && d.getDui().toLowerCase().contains(queryLower)) ||
                             (d.getUbicacion() != null && d.getUbicacion().toLowerCase().contains(queryLower)))
                .collect(Collectors.toList());
    }
}