package com.cementerio.service.impl;

import com.cementerio.entity.*;
import com.cementerio.repository.*;
import com.cementerio.service.CementerioService;
import com.cementerio.service.DuiValidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CementerioServiceImpl implements CementerioService {

    private final CementerioRepository cementerioRepository;
    private final SeccionRepository seccionRepository;
    private final ParcelaRepository parcelaRepository;
    private final CriptaRepository criptaRepository;
    private final EspacioRepository espacioRepository;
    private final DifuntoRepository difuntoRepository;
    private final DuiValidationService duiValidationService;
    private final UsuarioRepository usuarioRepository;

    @Override
    public Cementerio crearCementerio(String nombre, boolean tienePrivado) {
        System.out.println("Iniciando creación de cementerio: " + nombre);
        try {
            Cementerio cementerio = new Cementerio();
            cementerio.setNombre(nombre);
            cementerio.setTienePrivado(tienePrivado);
            cementerio = cementerioRepository.save(cementerio);

            // Crear secciones base (sin parcelas - el admin las agrega manualmente)
            crearSeccionBase(cementerio, "PUBLICO");
            if (tienePrivado) {
                crearSeccionBase(cementerio, "PRIVADO");
            }

            System.out.println("Cementerio guardado con ID: " + cementerio.getId());
            return cementerio;
        } catch (Exception e) {
            System.err.println("ERROR AL CREAR CEMENTERIO: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    private void crearSeccionBase(Cementerio cementerio, String nombreSeccion) {
        Seccion seccion = new Seccion();
        seccion.setNombre(nombreSeccion);
        seccion.setCementerio(cementerio);
        seccionRepository.save(seccion);
    }

    @Override
    public List<Cementerio> listarTodos() {
        return cementerioRepository.findAll();
    }

    @Override
    public Cementerio obtenerPorId(Long id) {
        return cementerioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cementerio no encontrado con ID: " + id));
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void eliminarCementerio(Long id) {
        if (!cementerioRepository.existsById(id)) {
            throw new RuntimeException("Cementerio no encontrado con ID: " + id);
        }
        cementerioRepository.deleteById(id);
    }

    @Override
    public java.util.List<Seccion> getSeccionesPorCementerio(Long cementerioId) {
        return seccionRepository.findByCementerioId(cementerioId);
    }

    private void crearSeccion(Cementerio cementerio, String nombreSeccion, int numeroParcelas) {
        Seccion seccion = new Seccion();
        seccion.setNombre(nombreSeccion);
        seccion.setCementerio(cementerio);
        seccion = seccionRepository.save(seccion);

        for (int i = 1; i <= numeroParcelas; i++) {
            Parcela parcela = new Parcela();
            parcela.setNombre("Parcela " + i);
            parcela.setSeccion(seccion);
            parcela = parcelaRepository.save(parcela);
            crearCriptas(parcela, 3, 3);
        }
    }

    private void crearCriptas(Parcela parcela, int filas, int columnas) {
        for (int f = 1; f <= filas; f++) {
            for (int c = 1; c <= columnas; c++) {
                Cripta cripta = new Cripta();
                cripta.setFila(f);
                cripta.setColumna(c);
                cripta.setParcela(parcela);
                cripta = criptaRepository.save(cripta);

                for (int i = 1; i <= 4; i++) {
                    Espacio espacio = new Espacio();
                    espacio.setNumero(i);
                    espacio.setCripta(cripta);
                    espacioRepository.save(espacio);
                }
            }
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public void liberarEspacio(Long espacioId) {
        Espacio espacio = espacioRepository.findById(espacioId)
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado"));
                
        validarPermisoSobreEspacio(espacio);
        
        // Si hay un difunto, lo borramos
        if (espacio.getDifunto() != null) {
            difuntoRepository.delete(espacio.getDifunto());
            espacio.setDifunto(null);
        }
        
        espacio.setEstado(EstadoEspacio.DISPONIBLE);
        espacioRepository.save(espacio);
    }

    @Override
    @org.springframework.transaction.annotation.Transactional
    public com.cementerio.entity.Difunto editarDifuntoDeEspacio(Long espacioId, com.cementerio.entity.Difunto datosDifunto) {
        Espacio espacio = espacioRepository.findById(espacioId)
                .orElseThrow(() -> new RuntimeException("Espacio no encontrado"));
                
        validarPermisoSobreEspacio(espacio);
        
        com.cementerio.entity.Difunto difunto = espacio.getDifunto();
        if (difunto == null) {
            // Si estaba vacío, creamos uno nuevo
            difunto = new com.cementerio.entity.Difunto();
            difunto.setEspacio(espacio);
            espacio.setEstado(EstadoEspacio.OCUPADO);
        }
        
        duiValidationService.validarDuiUnico(datosDifunto.getDui(), "DIFUNTO", difunto.getId());
        
        difunto.setNombre(datosDifunto.getNombre());
        difunto.setDui(datosDifunto.getDui());
        difunto.setEdad(datosDifunto.getEdad());
        difunto.setSexo(datosDifunto.getSexo());
        difunto.setEstadoCivil(datosDifunto.getEstadoCivil());
        difunto.setCausaMuerte(datosDifunto.getCausaMuerte());
        difunto.setDomicilioFallecido(datosDifunto.getDomicilioFallecido());
        difunto.setNombreResponsable(datosDifunto.getNombreResponsable());
        difunto.setDomicilioResponsable(datosDifunto.getDomicilioResponsable());
        difunto.setCelularResponsable(datosDifunto.getCelularResponsable());
        difunto.setFechaNacimiento(datosDifunto.getFechaNacimiento());
        difunto.setFechaFallecimiento(datosDifunto.getFechaFallecimiento());
        difunto.setHoraFallecimiento(datosDifunto.getHoraFallecimiento());
        difunto.setFechaEntierro(datosDifunto.getFechaEntierro());
        difunto.setHoraEntierro(datosDifunto.getHoraEntierro());
        difunto.setMaterialPlaca(datosDifunto.getMaterialPlaca());
        difunto.setMedidasPlaca(datosDifunto.getMedidasPlaca());
        difunto.setFirmasAutorizadas(datosDifunto.getFirmasAutorizadas());
        difunto.setDocumentosJson(datosDifunto.getDocumentosJson());
        
        boolean esPrivado = false;
        if (espacio.getCripta() != null && espacio.getCripta().getParcela() != null && 
            espacio.getCripta().getParcela().getSeccion() != null) {
            esPrivado = "PRIVADO".equalsIgnoreCase(espacio.getCripta().getParcela().getSeccion().getNombre());
        }
        difunto.setEsPrivado(esPrivado);
        
        difunto = difuntoRepository.save(difunto);
        espacioRepository.save(espacio);
        return difunto;
    }

    private void validarPermisoSobreEspacio(Espacio espacio) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_ADMINISTRADOR"));
            if (!isAdmin) {
                Usuario currentUser = usuarioRepository.findByCorreo(auth.getName()).orElse(null);
                if (currentUser != null && currentUser.getCementerio() != null) {
                    if (espacio.getCripta() != null && espacio.getCripta().getParcela() != null && espacio.getCripta().getParcela().getSeccion() != null) {
                        if (!espacio.getCripta().getParcela().getSeccion().getCementerio().getId().equals(currentUser.getCementerio().getId())) {
                            throw new RuntimeException("No tiene permisos para operar en este cementerio");
                        }
                    }
                }
            }
        }
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public com.cementerio.dto.ResumenDTO obtenerResumen() {
        com.cementerio.dto.ResumenDTO resumen = new com.cementerio.dto.ResumenDTO();
        List<Cementerio> cementerios = cementerioRepository.findAll();
        
        long totalCem = cementerios.size();
        long totalParc = 0;
        long difPub = 0;
        long difPriv = 0;
        long disp = 0;
        long ocup = 0;
        long mant = 0;
        
        java.util.List<com.cementerio.dto.ResumenDTO.DetallePrivado> detallesPrivados = new java.util.ArrayList<>();
        
        for (Cementerio c : cementerios) {
            for (Seccion s : c.getSecciones()) {
                boolean esPrivado = "PRIVADO".equalsIgnoreCase(s.getNombre());
                totalParc += s.getParcelas().size();
                for (Parcela p : s.getParcelas()) {
                    for (Cripta cr : p.getCriptas()) {
                        for (Espacio esp : cr.getEspacios()) {
                            if (esp.getEstado() == null || esp.getEstado() == EstadoEspacio.DISPONIBLE) {
                                disp++;
                            } else if (esp.getEstado() == EstadoEspacio.OCUPADO) {
                                ocup++;
                                if (esPrivado) {
                                    difPriv++;
                                } else {
                                    difPub++;
                                }
                                
                                if (esPrivado && esp.getDifunto() != null) {
                                    com.cementerio.dto.ResumenDTO.DetallePrivado det = new com.cementerio.dto.ResumenDTO.DetallePrivado();
                                    det.setDifunto(esp.getDifunto().getNombre());
                                    det.setCementerio(c.getNombre());
                                    det.setParcela(p.getNombre());
                                    if (cr.getCliente() != null) {
                                        det.setPropietario(cr.getCliente().getNombre());
                                    } else {
                                        det.setPropietario("Sin asignar");
                                    }
                                    
                                    List<String> benList = new java.util.ArrayList<>();
                                    if (cr.getBeneficiarios() != null) {
                                        for (Beneficiario b : cr.getBeneficiarios()) {
                                            benList.add(b.getNombre());
                                        }
                                    }
                                    det.setBeneficiarios(benList);
                                    detallesPrivados.add(det);
                                }
                            } else if (esp.getEstado() == EstadoEspacio.EN_MANTENIMIENTO) {
                                mant++;
                            }
                        }
                    }
                }
            }
        }
        
        resumen.setTotalCementerios(totalCem);
        resumen.setTotalParcelas(totalParc);
        resumen.setTotalDifuntosPublicos(difPub);
        resumen.setTotalDifuntosPrivados(difPriv);
        resumen.setEspaciosDisponibles(disp);
        resumen.setEspaciosOcupados(ocup);
        resumen.setEspaciosMantenimiento(mant);
        resumen.setDetallesPrivados(detallesPrivados);
        
        return resumen;
    }
}
