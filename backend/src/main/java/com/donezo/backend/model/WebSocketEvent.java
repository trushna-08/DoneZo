package com.donezo.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketEvent {
    private String type; // e.g. "TASK", "EVENT"
    private String action; // e.g. "CREATE", "UPDATE", "DELETE"
    private Object payload; // The actual object (Task or CalendarEvent) or the ID if deleted
}
