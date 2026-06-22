package com.cementerio.service;

import com.cementerio.entity.Auditoria;
import com.cementerio.entity.Usuario;
import com.cementerio.repository.AuditoriaRepository;
import com.cementerio.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;
    private final UsuarioRepository usuarioRepository;

    public AuditoriaService(AuditoriaRepository auditoriaRepository, UsuarioRepository usuarioRepository) {
        this.auditoriaRepository = auditoriaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public void registrarAccion(String correoUsuario, String accion, String detalles) {
        Usuario usuario = usuarioRepository.findByCorreo(correoUsuario).orElse(null);
        
        Auditoria log = new Auditoria();
        log.setUsuario(usuario);
        log.setAccion(accion);
        log.setDetalles(detalles);
        log.setFechaHora(LocalDateTime.now());
        
        auditoriaRepository.save(log);
    }
}
