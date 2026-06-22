package com.cementerio.config;

import com.cementerio.service.AuditoriaService;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class AuditoriaAspect {

    private final AuditoriaService auditoriaService;

    public AuditoriaAspect(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @AfterReturning("@annotation(org.springframework.web.bind.annotation.PostMapping) || " +
                   "@annotation(org.springframework.web.bind.annotation.PutMapping) || " +
                   "@annotation(org.springframework.web.bind.annotation.DeleteMapping)")
    public void registrarAuditoria(JoinPoint joinPoint) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !authentication.getPrincipal().equals("anonymousUser")) {
            String correoUsuario = authentication.getName();
            String metodo = joinPoint.getSignature().getName();
            String clase = joinPoint.getTarget().getClass().getSimpleName();
            
            String accion = "Ejecutó " + metodo + " en " + clase;
            String detalles = "Módulo: " + clase + " | Acción: " + metodo;

            auditoriaService.registrarAccion(correoUsuario, accion, detalles);
        }
    }
}
