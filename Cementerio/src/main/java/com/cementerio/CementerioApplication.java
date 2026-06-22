package com.cementerio;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder; // Importar la clase

@SpringBootApplication
public class CementerioApplication {

    public static void main(String[] args) {
        SpringApplication.run(CementerioApplication.class, args);

        // =======================================================
        // CÓDIGO TEMPORAL PARA GENERAR EL HASH DE '1234'
        // =======================================================
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String nuevoHash = encoder.encode("1234");

        System.out.println("=========================================================");
        System.out.println("NUEVO HASH PARA LA CONTRASEÑA '1234':");
        System.out.println(nuevoHash);
        System.out.println("=========================================================");
        // =======================================================
    }
}