package com.donezo.backend.model;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class CopilotRequest {
    private String apiKey;
    private String systemPrompt;
    private List<Map<String, String>> messages;

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getSystemPrompt() { return systemPrompt; }
    public void setSystemPrompt(String systemPrompt) { this.systemPrompt = systemPrompt; }
    public List<Map<String, String>> getMessages() { return messages; }
    public void setMessages(List<Map<String, String>> messages) { this.messages = messages; }
}
