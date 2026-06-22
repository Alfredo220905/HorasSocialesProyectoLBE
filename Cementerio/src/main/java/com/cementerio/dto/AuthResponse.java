package com.cementerio.dto;

public class AuthResponse {
    private String token;
    private Long id;
    private String rol;
    private boolean esTemporal; 
    private Long cementerioId;
    private String cementerioNombre;

    public AuthResponse() {}

    public AuthResponse(String token, Long id, String rol, boolean esTemporal, Long cementerioId, String cementerioNombre) {
        this.token = token;
        this.id = id;
        this.rol = rol;
        this.esTemporal = esTemporal;
        this.cementerioId = cementerioId;
        this.cementerioNombre = cementerioNombre;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
    public boolean isEsTemporal() { return esTemporal; }
    public void setEsTemporal(boolean esTemporal) { this.esTemporal = esTemporal; }
    public Long getCementerioId() { return cementerioId; }
    public void setCementerioId(Long cementerioId) { this.cementerioId = cementerioId; }
    public String getCementerioNombre() { return cementerioNombre; }
    public void setCementerioNombre(String cementerioNombre) { this.cementerioNombre = cementerioNombre; }
}
