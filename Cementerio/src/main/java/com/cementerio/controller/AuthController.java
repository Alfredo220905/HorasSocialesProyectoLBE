package com.cementerio.controller;

import com.cementerio.dto.AuthResponse;
import com.cementerio.entity.Usuario;
import com.cementerio.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor

public class AuthController {

    private final UsuarioService usuarioService;
    private final com.cementerio.security.JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String correo = body.get("correo");
        String contrasena = body.get("contrasena");

        try {
            Usuario usuario = usuarioService.validar(correo, contrasena);
            
            // Generamos un JWT real
            String jwtToken = jwtService.generateToken(usuario.getCorreo());
            
            Long cemId = (usuario.getCementerio() != null) ? usuario.getCementerio().getId() : null;
            String cemNombre = (usuario.getCementerio() != null) ? usuario.getCementerio().getNombre() : null;
            
            AuthResponse response = new AuthResponse(
                jwtToken,
                usuario.getIdUsuario(),
                usuario.getRol(),
                usuario.getEsTemporal(),
                cemId,
                cemNombre
            );
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }
}
