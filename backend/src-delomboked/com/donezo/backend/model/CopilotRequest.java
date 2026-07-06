package com.donezo.backend.model;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class CopilotRequest {
    private String apiKey;
    private String systemPrompt;
    private List<Map<String, String>> messages;
}
