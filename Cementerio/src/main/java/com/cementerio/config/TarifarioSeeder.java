package com.cementerio.config;

import com.cementerio.entity.TasaServicio;
import com.cementerio.repository.TasaServicioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TarifarioSeeder implements CommandLineRunner {

    private final TasaServicioRepository tasaServicioRepository;

    @Override
    public void run(String... args) {
        if (tasaServicioRepository.count() == 0) {
            List<TasaServicio> tasas = Arrays.asList(
                // CEMENTERIO JARDÍN
                new TasaServicio(null, "JARDIN", "Cripta Estándar", 141.75, false),
                new TasaServicio(null, "JARDIN", "Cripta Grande", 184.28, false),
                new TasaServicio(null, "JARDIN", "Obtención de lote (4 nichos subterráneos de 2.50m x 1.00m)", 891.03, false),
                new TasaServicio(null, "JARDIN", "Derecho de Enterramiento de cadáveres (c/u)", 36.75, false),
                new TasaServicio(null, "JARDIN", "Inhumación en nichos (c/u)", 36.75, false),
                new TasaServicio(null, "JARDIN", "Abrir y cerrar cada nicho", 48.61, false),
                new TasaServicio(null, "JARDIN", "Exploración de nichos (c/u)", 36.75, false),
                new TasaServicio(null, "JARDIN", "Reposición de Título a perpetuidad", 36.75, false),
                new TasaServicio(null, "JARDIN", "Traspaso de Título a perpetuidad", 36.75, false),
                new TasaServicio(null, "JARDIN", "Registro de nuevos beneficiarios en Títulos a perpetuidad (c/u)", 26.25, false),
                new TasaServicio(null, "JARDIN", "Tasa mensual de mantenimiento, ornato y limpieza", 2.63, false),
                new TasaServicio(null, "JARDIN", "Uso de cripta por segunda vez (después de 15 años)", 210.00, false),

                // CEMENTERIO GENERAL
                new TasaServicio(null, "GENERAL", "Obtener derecho perpetuo para enterramiento (por m2)", 64.83, false),
                new TasaServicio(null, "GENERAL", "Enterramiento verificado en nichos construidos en fosas", 36.75, false),
                new TasaServicio(null, "GENERAL", "Abrir y cerrar cada nicho para cualquier objeto", 48.62, false),
                new TasaServicio(null, "GENERAL", "Traspaso o reposición de título general", 36.75, false),
                new TasaServicio(null, "GENERAL", "Certificación de partidas o asientos de libros", 3.15, false),
                new TasaServicio(null, "GENERAL", "Construcción de nichos especiales de mampostería (Jardinera)", 48.62, false),
                new TasaServicio(null, "GENERAL", "Construcción de nichos especiales de mampostería estándar", 81.00, false),
                new TasaServicio(null, "GENERAL", "Construcción de sótanos en contra cava de mausoleo (3 nichos)", 110.25, false),
                new TasaServicio(null, "GENERAL", "Construcción de sótanos en contra cava de mausoleo (6 nichos)", 291.64, false),
                new TasaServicio(null, "GENERAL", "Construcción de sótanos en contra cava de mausoleo (9 nichos)", 437.43, false),
                new TasaServicio(null, "GENERAL", "Enterramiento adultos en fosas (2.00m x 0.80cm)", 26.25, false),
                new TasaServicio(null, "GENERAL", "Enterramiento infantes/restos en fosa (1.20m x 0.80cm)", 26.25, false),
                new TasaServicio(null, "GENERAL", "Año de prórroga para conservar restos en misma sepultura", 15.75, false),

                // OSARIOS
                new TasaServicio(null, "OSARIO", "Enterramiento de osamenta en osario", 24.30, false),
                new TasaServicio(null, "OSARIO", "Uso de osario al año", 18.90, false),

                // SERVICIOS GENERALES
                new TasaServicio(null, "SERVICIOS_GENERALES", "Traslado de osamenta a otro nicho u osario", 31.50, false),
                new TasaServicio(null, "SERVICIOS_GENERALES", "Arrendamiento de local para embalsamar", 32.44, false),
                new TasaServicio(null, "SERVICIOS_GENERALES", "Traslado de cadáver interno (Cementerio/Municipio)", 31.50, false),
                new TasaServicio(null, "SERVICIOS_GENERALES", "Extracción de osamenta para traslado", 31.50, false),
                new TasaServicio(null, "SERVICIOS_GENERALES", "Permiso para trasladar fuera del país/municipio", 48.62, true),
                new TasaServicio(null, "SERVICIOS_GENERALES", "Autorización para incinerar cadáveres", 157.50, false),
                new TasaServicio(null, "SERVICIOS_GENERALES", "Funcionamiento de cementerios particulares autorizados", 2073.75, false),
                new TasaServicio(null, "SERVICIOS_GENERALES", "Permiso para enterramiento en cementerios particulares", 52.50, false)
            );
            tasaServicioRepository.saveAll(tasas);
            System.out.println("✅ Tarifario Oficial (24+ impuestos) guardado en base de datos correctamente.");
        }
    }
}
