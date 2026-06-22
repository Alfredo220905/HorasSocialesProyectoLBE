package com.cementerio.controller;

import com.cementerio.entity.Usuario;
import com.cementerio.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor

@PreAuthorize("hasAnyRole('ADMIN', 'INFORMATICA')")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public List<Usuario> listar() {
        return usuarioService.listarTodos();
    }

    @PostMapping
    public Usuario crear(@RequestBody Usuario usuario) {
        return usuarioService.guardarUsuario(usuario);
    }

    @PutMapping("/{id}")
    public Usuario actualizar(@PathVariable Long id, @RequestBody Usuario usuario) {
        return usuarioService.actualizar(id, usuario);
    }

    @PutMapping("/{id}/cambiar-password")
    @PreAuthorize("hasAnyRole('ADMIN', 'INFORMATICA') or authentication.principal.idUsuario == #id")
    public Usuario cambiarPassword(@PathVariable Long id, @RequestBody java.util.Map<String, String> body) {
        String nuevaPass = body.get("contrasena");
        return usuarioService.actualizarPassword(id, nuevaPass);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        usuarioService.eliminar(id);
    }
}
