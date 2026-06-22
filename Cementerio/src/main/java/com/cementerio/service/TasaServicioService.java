package com.cementerio.service;

import com.cementerio.entity.TasaServicio;
import com.cementerio.repository.TasaServicioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TasaServicioService {

    private final TasaServicioRepository repository;

    public List<TasaServicio> listarTodos() {
        return repository.findAll();
    }
}
