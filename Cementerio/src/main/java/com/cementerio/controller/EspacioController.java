package com.cementerio.controller;

import com.cementerio.entity.Espacio;
import com.cementerio.entity.EstadoEspacio;
import com.cementerio.repository.EspacioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/espacios")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class EspacioController {

    private final EspacioRepository espacioRepository;

    @GetMapping("/por-cementerio/{cementerioId}")
    public List<Map<String, Object>> espaciosPorCementerio(@PathVariable Long cementerioId) {
        List<Espacio> espacios = espacioRepository.findByCementerioId(cementerioId);
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Espacio e : espacios) {
            boolean ocupado = e.getDifunto() != null ||
                              (e.getEstado() != null && e.getEstado() == EstadoEspacio.OCUPADO);

            String seccion = "Sin sección";
            String parcela = "Sin parcela";
            String lote = "Lote";

            if (e.getCripta() != null) {
                lote = "F" + e.getCripta().getFila() + "-C" + e.getCripta().getColumna();
                if (e.getCripta().getParcela() != null) {
                    parcela = e.getCripta().getParcela().getNombre() != null
                            ? e.getCripta().getParcela().getNombre()
                            : "Parcela " + e.getCripta().getParcela().getId();
                    if (e.getCripta().getParcela().getSeccion() != null) {
                        seccion = e.getCripta().getParcela().getSeccion().getNombre() != null
                                ? e.getCripta().getParcela().getSeccion().getNombre()
                                : "Sec. " + e.getCripta().getParcela().getSeccion().getId();
                    }
                }
            }

            String label = seccion + " / " + parcela + " / " + lote + " / Esp." + e.getNumero();
            String difuntoNombre = (e.getDifunto() != null) ? e.getDifunto().getNombre() : "";

            Map<String, Object> item = new HashMap<>();
            item.put("id", e.getId());
            item.put("label", label);
            item.put("seccion", seccion);
            item.put("parcela", parcela);
            item.put("lote", lote);
            item.put("numero", e.getNumero());
            item.put("ocupado", ocupado);
            item.put("difunto", difuntoNombre);

            resultado.add(item);
        }

        return resultado;
    }
}

