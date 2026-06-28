package com.cementerio.service;

import com.cementerio.entity.Usuario;
import com.cementerio.repository.UsuarioRepository;
import com.cementerio.repository.AuditoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;  

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository repo;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaRepository auditoriaRepository;
    private final com.cementerio.repository.CementerioRepository cementerioRepo;

    public Usuario validar(String correo, String contrasena) {
        Usuario u = repo.findByCorreo(correo)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!passwordEncoder.matches(contrasena, u.getContrasena())) {
            throw new RuntimeException("Credenciales inválidas");
        }

        return u;
    }

    public List<Usuario> listarTodos() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        List<Usuario> usuarios = repo.findAll();
        
        if (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return usuarios.stream()
                    .filter(u -> !"INFORMATICA".equals(u.getRol()))
                    .collect(java.util.stream.Collectors.toList());
        }
        return usuarios;
    }

    public Usuario guardarUsuario(Usuario u) {
        try {
            if (u.getContrasena() == null || u.getContrasena().isEmpty()) {
                throw new RuntimeException("La contraseña temporal es obligatoria");
            }
            
            // Si viene un cementerio con ID, lo buscamos para asegurar que existe y está completo
            if ("OPERADOR".equals(u.getRol()) && u.getCementerio() != null && u.getCementerio().getId() != null) {
                var cem = cementerioRepo.findById(u.getCementerio().getId())
                    .orElseThrow(() -> new RuntimeException("El cementerio seleccionado no existe"));
                u.setCementerio(cem);
            } else {
                u.setCementerio(null);
            }
            
            // Encriptamos la contraseña para seguridad
            u.setContrasena(passwordEncoder.encode(u.getContrasena()));
            
            // Aseguramos que los usuarios nuevos siempre sean temporales para obligar cambio de clave
            if (u.getEsTemporal() == null) u.setEsTemporal(true);
            
            System.out.println("DEBUG: Guardando usuario " + u.getCorreo() + " con Rol " + u.getRol());
            return repo.save(u);
        } catch (Exception e) {
            System.err.println("ERROR AL GUARDAR: " + e.getMessage());
            throw new RuntimeException("Error en base de datos: " + e.getMessage());
        }
    }

    public Usuario actualizar(Long id, Usuario u) {
        Usuario existente = repo.findById(id).orElseThrow();
        existente.setCorreo(u.getCorreo());
        existente.setRol(u.getRol());
        if (u.getContrasena() != null && !u.getContrasena().isEmpty()) {
            existente.setContrasena(passwordEncoder.encode(u.getContrasena()));
        }
        
        if ("OPERADOR".equals(u.getRol()) && u.getCementerio() != null && u.getCementerio().getId() != null) {
            var cem = cementerioRepo.findById(u.getCementerio().getId())
                .orElseThrow(() -> new RuntimeException("El cementerio seleccionado no existe"));
            existente.setCementerio(cem);
        } else {
            existente.setCementerio(null);
        }
        
        return repo.save(existente);
    }

    @Transactional
    public void eliminar(Long id) {
        auditoriaRepository.desvincularUsuario(id);
        repo.deleteById(id);
    }

    public Usuario actualizarPassword(Long id, String nuevaPass, Boolean esTemporal) {
        Usuario u = repo.findById(id).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        u.setContrasena(passwordEncoder.encode(nuevaPass));
        u.setEsTemporal(esTemporal != null ? esTemporal : false);
        System.out.println("DEBUG: Contraseña actualizada para " + u.getCorreo() + ". esTemporal puesto en " + u.getEsTemporal());
        return repo.save(u);
    }

    public String generarPasswordAleatoria() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            int index = (int) (Math.random() * chars.length());
            sb.append(chars.charAt(index));
        }
        return sb.toString();
    }
}
