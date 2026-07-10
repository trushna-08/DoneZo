package com.donezo.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class AppStatusController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> home() {
        return ResponseEntity.ok(
                Map.of(
                        "app", "DoneZo",
                        "status", "running",
                        "message", "DoneZo Backend is running successfully"
                )
        );
    }

    @GetMapping("/api/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(
                Map.of(
                        "app", "DoneZo",
                        "status", "OK",
                        "service", "DoneZo Backend"
                )
        );
    }
}
