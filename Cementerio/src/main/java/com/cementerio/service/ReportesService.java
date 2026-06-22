package com.cementerio.service;

import com.cementerio.entity.Cliente;
import com.cementerio.entity.Cripta;
import com.cementerio.entity.Difunto;
import com.cementerio.entity.Espacio;
import com.cementerio.entity.EstadoEspacio;
import com.cementerio.entity.Transferencia;
import com.cementerio.repository.CriptaRepository;
import com.cementerio.repository.TransferenciaRepository;
import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Document;
import com.itextpdf.text.Element;
import com.itextpdf.text.Font;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReportesService {

    private final CriptaRepository criptaRepository;
    private final TransferenciaRepository transferenciaRepository;
    private final com.cementerio.repository.UsuarioRepository usuarioRepository;

    public ReportesService(CriptaRepository criptaRepository,
                           TransferenciaRepository transferenciaRepository,
                           com.cementerio.repository.UsuarioRepository usuarioRepository) {
        this.criptaRepository = criptaRepository;
        this.transferenciaRepository = transferenciaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public byte[] generarReporteOcupacionExcel() {
        List<FilaOcupacion> filas = obtenerFilasOcupacion();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Ocupacion");

            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            if (headerStyle instanceof XSSFCellStyle xssfStyle) {
                xssfStyle.setFillForegroundColor(new XSSFColor(new java.awt.Color(214, 51, 132), null));
            }
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] headers = {
                "Cementerio", "Seccion", "Parcela", "Lote", "Espacio",
                "Estado", "Difunto", "Propietario", "DUI propietario"
            };

            Row header = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                header.createCell(i).setCellValue(headers[i]);
                header.getCell(i).setCellStyle(headerStyle);
            }

            int rowIndex = 1;
            int ocupados = 0;
            int disponibles = 0;
            int mantenimiento = 0;

            for (FilaOcupacion fila : filas) {
                Row row = sheet.createRow(rowIndex++);
                row.createCell(0).setCellValue(fila.cementerio());
                row.createCell(1).setCellValue(fila.seccion());
                row.createCell(2).setCellValue(fila.parcela());
                row.createCell(3).setCellValue(fila.lote());
                row.createCell(4).setCellValue(fila.espacio());
                row.createCell(5).setCellValue(fila.estado());
                row.createCell(6).setCellValue(fila.difunto());
                row.createCell(7).setCellValue(fila.propietario());
                row.createCell(8).setCellValue(fila.duiPropietario());

                if ("OCUPADO".equals(fila.estado())) ocupados++;
                else if ("EN_MANTENIMIENTO".equals(fila.estado())) mantenimiento++;
                else disponibles++;
            }

            rowIndex++;
            sheet.createRow(rowIndex++).createCell(0).setCellValue("Resumen generado: " + LocalDate.now());
            Row totalRow = sheet.createRow(rowIndex++);
            totalRow.createCell(0).setCellValue("Total espacios");
            totalRow.createCell(1).setCellValue(filas.size());
            Row ocupadosRow = sheet.createRow(rowIndex++);
            ocupadosRow.createCell(0).setCellValue("Ocupados");
            ocupadosRow.createCell(1).setCellValue(ocupados);
            Row disponiblesRow = sheet.createRow(rowIndex++);
            disponiblesRow.createCell(0).setCellValue("Disponibles");
            disponiblesRow.createCell(1).setCellValue(disponibles);
            Row mantenimientoRow = sheet.createRow(rowIndex);
            mantenimientoRow.createCell(0).setCellValue("En mantenimiento");
            mantenimientoRow.createCell(1).setCellValue(mantenimiento);

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("No se pudo generar el reporte de ocupacion en Excel", e);
        }
    }

    public byte[] generarReporteOcupacionPdf() {
        List<FilaOcupacion> filas = obtenerFilasOcupacion();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.LETTER.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.FontFamily.HELVETICA, 18, Font.BOLD, new BaseColor(214, 51, 132));
            Font subtitleFont = new Font(Font.FontFamily.HELVETICA, 10, Font.NORMAL, BaseColor.DARK_GRAY);
            document.add(new Paragraph("Reporte de ocupacion", titleFont));
            document.add(new Paragraph("Generado: " + LocalDate.now(), subtitleFont));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(new float[] { 2.2f, 1.3f, 1.5f, 1.1f, 1.1f, 1.4f, 2.2f, 2.2f });
            table.setWidthPercentage(100);

            agregarEncabezado(table, "Cementerio");
            agregarEncabezado(table, "Seccion");
            agregarEncabezado(table, "Parcela");
            agregarEncabezado(table, "Lote");
            agregarEncabezado(table, "Espacio");
            agregarEncabezado(table, "Estado");
            agregarEncabezado(table, "Difunto");
            agregarEncabezado(table, "Propietario");

            int ocupados = 0;
            int disponibles = 0;
            int mantenimiento = 0;

            for (FilaOcupacion fila : filas) {
                table.addCell(fila.cementerio());
                table.addCell(fila.seccion());
                table.addCell(fila.parcela());
                table.addCell(fila.lote());
                table.addCell(fila.espacio());
                table.addCell(fila.estado());
                table.addCell(fila.difunto());
                table.addCell(fila.propietario());

                if ("OCUPADO".equals(fila.estado())) ocupados++;
                else if ("EN_MANTENIMIENTO".equals(fila.estado())) mantenimiento++;
                else disponibles++;
            }

            document.add(table);
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Total espacios: " + filas.size(), subtitleFont));
            document.add(new Paragraph("Ocupados: " + ocupados + " | Disponibles: " + disponibles + " | En mantenimiento: " + mantenimiento, subtitleFont));
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("No se pudo generar el reporte de ocupacion en PDF", e);
        }
    }

    public List<Transferencia> obtenerHistorialActividades() {
        return transferenciaRepository.findAll();
    }

    private List<FilaOcupacion> obtenerFilasOcupacion() {
        List<FilaOcupacion> filas = new ArrayList<>();
        
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        com.cementerio.entity.Cementerio cementerioUsuario = null;
        
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            com.cementerio.entity.Usuario user = usuarioRepository.findByCorreo(auth.getName()).orElse(null);
            if (user != null) {
                cementerioUsuario = user.getCementerio();
            }
        }

        for (Cripta cripta : criptaRepository.findAll()) {
            Cliente cliente = cripta.getCliente();
            String cementerio = "Sin cementerio";
            String seccion = "Sin seccion";
            String parcela = "Sin parcela";

            if (cripta.getParcela() != null) {
                parcela = texto(cripta.getParcela().getNombre(), "Parcela " + cripta.getParcela().getId());
                if (cripta.getParcela().getSeccion() != null) {
                    seccion = texto(cripta.getParcela().getSeccion().getNombre(), "Seccion " + cripta.getParcela().getSeccion().getId());
                    if (cripta.getParcela().getSeccion().getCementerio() != null) {
                        cementerio = texto(cripta.getParcela().getSeccion().getCementerio().getNombre(), "Cementerio " + cripta.getParcela().getSeccion().getCementerio().getId());
                    }
                }
            }
            
            // Si el usuario tiene un cementerio asignado, filtrar criptas que no pertenezcan a ese cementerio
            if (cementerioUsuario != null && cripta.getParcela() != null && cripta.getParcela().getSeccion() != null && cripta.getParcela().getSeccion().getCementerio() != null) {
                if (!cripta.getParcela().getSeccion().getCementerio().getId().equals(cementerioUsuario.getId())) {
                    continue; // Saltar si no pertenece al cementerio del usuario
                }
            }

            List<Espacio> espacios = cripta.getEspacios() == null ? List.of() : cripta.getEspacios();
            for (Espacio espacio : espacios) {
                Difunto difunto = espacio.getDifunto();
                EstadoEspacio estado = espacio.getEstado();
                String estadoTexto = estado != null ? estado.name() : (difunto != null ? "OCUPADO" : "DISPONIBLE");

                filas.add(new FilaOcupacion(
                    cementerio,
                    seccion,
                    parcela,
                    "Fila " + cripta.getFila() + " / Columna " + cripta.getColumna(),
                    String.valueOf(espacio.getNumero()),
                    estadoTexto,
                    difunto != null ? texto(difunto.getNombre(), "Sin nombre") : "",
                    cliente != null ? texto(cliente.getNombre(), "Sin nombre") : "",
                    cliente != null ? texto(cliente.getDui(), "") : ""
                ));
            }
        }

        return filas;
    }

    private void agregarEncabezado(PdfPTable table, String texto) {
        Font font = new Font(Font.FontFamily.HELVETICA, 9, Font.BOLD, BaseColor.WHITE);
        PdfPCell cell = new PdfPCell(new Phrase(texto, font));
        cell.setBackgroundColor(new BaseColor(214, 51, 132));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPadding(5);
        table.addCell(cell);
    }

    private String texto(String valor, String fallback) {
        return valor == null || valor.trim().isEmpty() ? fallback : valor;
    }

    private record FilaOcupacion(
        String cementerio,
        String seccion,
        String parcela,
        String lote,
        String espacio,
        String estado,
        String difunto,
        String propietario,
        String duiPropietario
    ) {}
}
