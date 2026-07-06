package com.donezo.backend.controller;

import com.donezo.backend.model.CalendarEvent;
import com.donezo.backend.model.WebSocketEvent;
import com.donezo.backend.dto.CalendarEventDto;
import com.donezo.backend.repository.CalendarEventRepository;
import com.donezo.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class CalendarEventController {

    @Autowired
    private CalendarEventRepository eventRepository;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public List<CalendarEvent> getAllEvents(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return eventRepository.findByUserId(userDetails.getUser().getId());
    }

    @PostMapping
    public CalendarEvent createEvent(@AuthenticationPrincipal UserDetailsImpl userDetails, @Valid @RequestBody CalendarEventDto eventDto) {
        CalendarEvent event = new CalendarEvent();
        event.setTitle(eventDto.getTitle());
        event.setDescription(eventDto.getDescription());
        event.setDate(eventDto.getDate());
        event.setTime(eventDto.getTime());
        event.setUserId(userDetails.getUser().getId());
        
        CalendarEvent savedEvent = eventRepository.save(event);
        broadcastEvent(userDetails.getUser().getId(), "CREATE", savedEvent);
        return savedEvent;
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalendarEvent> updateEvent(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable String id,
            @Valid @RequestBody CalendarEventDto eventDto) {
        return eventRepository.findById(id)
                .filter(e -> e.getUserId().equals(userDetails.getUser().getId()))
                .map(event -> {
                    event.setTitle(eventDto.getTitle());
                    event.setDescription(eventDto.getDescription());
                    event.setDate(eventDto.getDate());
                    event.setTime(eventDto.getTime());
                    
                    CalendarEvent updatedEvent = eventRepository.save(event);
                    broadcastEvent(userDetails.getUser().getId(), "UPDATE", updatedEvent);
                    return ResponseEntity.ok(updatedEvent);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable String id) {
        return eventRepository.findById(id)
                .filter(e -> e.getUserId().equals(userDetails.getUser().getId()))
                .map(event -> {
                    eventRepository.delete(event);
                    broadcastEvent(userDetails.getUser().getId(), "DELETE", event.getId());
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    private void broadcastEvent(String userId, String action, Object payload) {
        WebSocketEvent wsEvent = WebSocketEvent.builder()
                .type("EVENT")
                .action(action)
                .payload(payload)
                .build();
        messagingTemplate.convertAndSend("/topic/events/" + userId, wsEvent);
    }
}
