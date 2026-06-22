package com.cementerio.dto;

import lombok.Data;

import java.util.List;

import com.cementerio.entity.Rol;

@Data
public class UsuarioRegistroDTO {
    private String nombre;
    private String correo;
    private String telefono;
    private String contrasena;
    private Rol rol;
    private List<Integer> idCementerios;
}