package com.cementerio.controller;

import com.cementerio.dto.TransferenciaDTO;
import com.cementerio.service.TransferenciaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transferencias")
@RequiredArgsConstructor
public class TransferenciaController {

    private final TransferenciaService transferenciaService;

    @GetMapping
    public List<TransferenciaDTO> listarTodos() {
        return transferenciaService.listarTodos();
    }

    @PostMapping
    public TransferenciaDTO realizarTraspaso(@RequestBody TransferenciaDTO dto) {
        return transferenciaService.realizarTraspaso(dto);
    }
}
