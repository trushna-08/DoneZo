package com.donezo.backend.controller;

import com.donezo.backend.model.CopilotRequest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/copilot")
public class CopilotController {

    private static final Logger log = LoggerFactory.getLogger(CopilotController.class);
    private final RestTemplate restTemplate = new RestTemplate();
    
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody CopilotRequest request) {
        if (request.getApiKey() == null || request.getApiKey().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("API Key is missing");
        }

        String anthropicUrl = "https://api.anthropic.com/v1/messages";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", request.getApiKey().trim());
        headers.set("anthropic-version", "2023-06-01");
        
        // Build the Anthropic request body
        Map<String, Object> body = new HashMap<>();
        body.put("model", "claude-3-haiku-20240307"); // A fast, capable model for Copilot tasks
        body.put("max_tokens", 1024);
        
        if (request.getSystemPrompt() != null && !request.getSystemPrompt().isEmpty()) {
            body.put("system", request.getSystemPrompt());
        }

        if (request.getMessages() != null) {
            body.put("messages", request.getMessages());
        } else {
            body.put("messages", new ArrayList<>());
        }

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(anthropicUrl, entity, Map.class);
            return ResponseEntity.ok(response.getBody());
            
        } catch (HttpClientErrorException e) {
            log.warn("Anthropic API request failed with status {}", e.getStatusCode());
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error("Error communicating with Anthropic API", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Unable to reach the AI service. Please try again later.");
        }
    }
}
