package com.cementerio.controller;

import com.cementerio.entity.Cliente;
import com.cementerio.repository.ClienteRepository;
import com.cementerio.repository.UsuarioRepository;
import com.cementerio.entity.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteRepository clienteRepository;
    private final com.cementerio.service.DuiValidationService duiValidationService;
    private final UsuarioRepository usuarioRepository;
    private final com.cementerio.repository.CriptaRepository criptaRepository;

    @GetMapping
    public List<Cliente> listarClientes() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_ADMINISTRADOR"));

        if (isAdmin) {
            return clienteRepository.findAll();
        }

        Usuario currentUser = usuarioRepository.findByCorreo(auth.getName()).orElse(null);
        if (currentUser != null && currentUser.getCementerio() != null) {
            return clienteRepository.findAll().stream()
                    .filter(c -> c.getCementerio() != null && c.getCementerio().getId().equals(currentUser.getCementerio().getId()))
                    .collect(java.util.stream.Collectors.toList());
        }
        return List.of();
    }

    @GetMapping("/buscar")
    public List<Cliente> buscarClientes(@org.springframework.web.bind.annotation.RequestParam(value = "q", required = false) String query) {
        List<Cliente> baseList = listarClientes(); // Usa el filtrado de seguridad
        if (query == null || query.trim().isEmpty()) {
            return baseList;
        }
        String q = query.trim().toLowerCase();
        return baseList.stream()
                .filter(c -> c.getNombre().toLowerCase().contains(q) || c.getDui().toLowerCase().contains(q))
                .collect(java.util.stream.Collectors.toList());
    }

    @GetMapping("/{id}/criptas")
    public List<java.util.Map<String, Object>> listarCriptasDeCliente(@PathVariable Long id) {
        return criptaRepository.findByClienteId(id).stream().map(c -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", c.getId());
            String seccion = c.getParcela() != null && c.getParcela().getSeccion() != null ? c.getParcela().getSeccion().getNombre() : "N/A";
            String parcela = c.getParcela() != null ? c.getParcela().getNombre() : "N/A";
            map.put("label", "Sec: " + seccion + " | Par: " + parcela + " | Lote (F" + c.getFila() + "-C" + c.getColumna() + ")");
            return map;
        }).collect(java.util.stream.Collectors.toList());
    }

    @PostMapping
    public Cliente crearCliente(@RequestBody Cliente cliente) {
        validar(cliente);
        duiValidationService.validarDuiUnico(cliente.getDui(), "CLIENTE", null);
        
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Usuario currentUser = usuarioRepository.findByCorreo(auth.getName()).orElse(null);
        if (currentUser != null && currentUser.getCementerio() != null) {
            cliente.setCementerio(currentUser.getCementerio());
        }

        return clienteRepository.save(cliente);
    }

    @PutMapping("/{id}")
    public Cliente actualizarCliente(@PathVariable Long id, @RequestBody Cliente datos) {
        validar(datos);
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        duiValidationService.validarDuiUnico(datos.getDui(), "CLIENTE", id);

        cliente.setNombre(datos.getNombre());
        cliente.setDui(datos.getDui());
        cliente.setTelefono(datos.getTelefono());
        cliente.setDireccion(datos.getDireccion());
        cliente.setCorreo(datos.getCorreo());
        return clienteRepository.save(cliente);
    }

    @DeleteMapping("/{id}")
    public void eliminarCliente(@PathVariable Long id) {
        if (!clienteRepository.existsById(id)) {
            throw new RuntimeException("Cliente no encontrado");
        }
        clienteRepository.deleteById(id);
    }

    private void validar(Cliente cliente) {
        if (cliente.getNombre() == null || cliente.getNombre().trim().isEmpty()) {
            throw new RuntimeException("El nombre del cliente es obligatorio");
        }
        if (cliente.getDui() == null || cliente.getDui().trim().isEmpty()) {
            throw new RuntimeException("El DUI del cliente es obligatorio");
        }
    }
}
