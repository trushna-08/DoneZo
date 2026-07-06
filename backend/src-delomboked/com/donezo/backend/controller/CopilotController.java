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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/copilot")
public class CopilotController {

    private final RestTemplate restTemplate = new RestTemplate();
    
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody CopilotRequest request) {
        if (request.getApiKey() == null || request.getApiKey().trim().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("API Key is missing");
        }

        String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + request.getApiKey().trim();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // Build the Gemini request body
        Map<String, Object> body = new HashMap<>();
        
        // System Prompt mapping
        if (request.getSystemPrompt() != null && !request.getSystemPrompt().isEmpty()) {
            Map<String, Object> systemInstruction = new HashMap<>();
            List<Map<String, String>> parts = new ArrayList<>();
            parts.add(Map.of("text", request.getSystemPrompt()));
            systemInstruction.put("parts", parts);
            body.put("systemInstruction", systemInstruction);
        }

        // Messages mapping
        List<Map<String, Object>> contents = new ArrayList<>();
        if (request.getMessages() != null) {
            for (Map<String, String> msg : request.getMessages()) {
                Map<String, Object> content = new HashMap<>();
                // Map roles: Anthropic "assistant" -> Gemini "model"
                String role = msg.get("role");
                if ("assistant".equals(role)) {
                    role = "model";
                }
                content.put("role", role);
                
                List<Map<String, String>> parts = new ArrayList<>();
                parts.add(Map.of("text", msg.get("content")));
                content.put("parts", parts);
                
                contents.add(content);
            }
        }
        body.put("contents", contents);

        // Force JSON response
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("responseMimeType", "application/json");
        body.put("generationConfig", generationConfig);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(geminiUrl, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();
            
            // Map Gemini response back to Anthropic structure so frontend doesn't break
            // Gemini path: candidates[0].content.parts[0].text
            String aiText = "No response";
            if (responseBody != null && responseBody.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) responseBody.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> firstCandidate = candidates.get(0);
                    Map<String, Object> content = (Map<String, Object>) firstCandidate.get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                    if (!parts.isEmpty()) {
                        aiText = (String) parts.get(0).get("text");
                    }
                }
            }
            
            // Format Anthropic style response
            Map<String, Object> anthropicFormat = new HashMap<>();
            List<Map<String, String>> resContent = new ArrayList<>();
            resContent.add(Map.of("text", aiText));
            anthropicFormat.put("content", resContent);
            
            return ResponseEntity.ok(anthropicFormat);
            
        } catch (HttpClientErrorException e) {
            System.err.println("Gemini API Error: " + e.getResponseBodyAsString());
            return generateFallbackResponse(request);
        } catch (Exception e) {
            System.err.println("Error communicating with Gemini API: " + e.getMessage());
            return generateFallbackResponse(request);
        }
    }
    
    private ResponseEntity<?> generateFallbackResponse(CopilotRequest request) {
        // Find the last user message
        String lastMessage = "Hello";
        if (request.getMessages() != null && !request.getMessages().isEmpty()) {
            lastMessage = request.getMessages().get(request.getMessages().size() - 1).get("content");
        }
        
        String aiText = "I'm your AI Assistant (powered by ChatGPT/Gemini technology)! You just said: '" + lastMessage + "'. \n\n" +
                "Right now, my connection to the cloud is slightly degraded, but I am still here to help you manage your tasks! " +
                "How can I assist you with your productivity today?";
                
        if (lastMessage.toLowerCase().contains("hi") || lastMessage.toLowerCase().contains("hello")) {
            aiText = "Hi there! I am your AI Copilot. It looks like you're trying to use me, but my API key might be invalid or disconnected right now. " +
                     "However, ChatGPT helped us build this beautiful interface, so I can still say hello! " +
                     "Please make sure you have a valid Gemini or Anthropic API key configured if you want full AI responses.";
        }

        // Check if the frontend expects a JSON payload (e.g. Assistant.jsx)
        if (request.getSystemPrompt() != null && request.getSystemPrompt().contains("JSON object matching the schema")) {
            aiText = "{\"action\": \"reply\", \"message\": \"" + aiText.replace("\"", "\\\"").replace("\n", "\\n") + "\"}";
        }
        
        Map<String, Object> anthropicFormat = new HashMap<>();
        List<Map<String, String>> resContent = new ArrayList<>();
        resContent.add(Map.of("text", aiText));
        anthropicFormat.put("content", resContent);
        
        return ResponseEntity.ok(anthropicFormat);
    }
}
