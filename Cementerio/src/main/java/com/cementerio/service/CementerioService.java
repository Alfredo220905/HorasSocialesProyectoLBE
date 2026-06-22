package com.cementerio.service;

import com.cementerio.entity.Cementerio;
import com.cementerio.dto.ResumenDTO;

public interface CementerioService {
    Cementerio crearCementerio(String nombre, boolean tienePrivado);
    java.util.List<Cementerio> listarTodos();
    Cementerio obtenerPorId(Long id);
    com.cementerio.dto.ResumenDTO obtenerResumen();

    void liberarEspacio(Long espacioId);
    com.cementerio.entity.Difunto editarDifuntoDeEspacio(Long espacioId, com.cementerio.entity.Difunto difunto);
    void eliminarCementerio(Long id);
    java.util.List<com.cementerio.entity.Seccion> getSeccionesPorCementerio(Long cementerioId);
}
