package com.cementerio.controller;

import com.cementerio.entity.TasaServicio;
import com.cementerio.service.TasaServicioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasas")
@RequiredArgsConstructor
public class TasaServicioController {

    private final TasaServicioService tasaServicioService;

    @GetMapping
    public List<TasaServicio> listarTodos() {
        return tasaServicioService.listarTodos();
    }
}
