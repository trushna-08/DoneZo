package com.donezo.backend.controller;

import com.donezo.backend.model.Task;
import com.donezo.backend.dto.TaskDto;
import com.donezo.backend.model.WebSocketEvent;
import com.donezo.backend.repository.TaskRepository;
import com.donezo.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public List<Task> getAllTasks(@AuthenticationPrincipal UserDetailsImpl userDetails) {
        return taskRepository.findByUserId(userDetails.getUser().getId());
    }

    @PostMapping
    public Task createTask(@AuthenticationPrincipal UserDetailsImpl userDetails, @Valid @RequestBody TaskDto taskDto) {
        Task task = new Task();
        task.setTitle(taskDto.getTitle());
        task.setDescription(taskDto.getDescription());
        task.setStatus(taskDto.getStatus() != null ? taskDto.getStatus() : "todo");
        task.setPriority(taskDto.getPriority() != null ? taskDto.getPriority() : "medium");
        task.setAssignee(taskDto.getAssignee());
        task.setDueDate(taskDto.getDueDate());
        task.setUserId(userDetails.getUser().getId());
        
        Task savedTask = taskRepository.save(task);
        broadcastEvent(userDetails.getUser().getId(), "CREATE", savedTask);
        return savedTask;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@AuthenticationPrincipal UserDetailsImpl userDetails, @PathVariable String id) {
        return taskRepository.findById(id)
                .filter(t -> t.getUserId().equals(userDetails.getUser().getId()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable String id,
            @Valid @RequestBody TaskDto taskDto) {
        return taskRepository.findById(id)
                .filter(t -> t.getUserId().equals(userDetails.getUser().getId()))
                .map(task -> {
                    task.setTitle(taskDto.getTitle());
                    task.setDescription(taskDto.getDescription());
                    
                    if (taskDto.getStatus() != null) {
                        task.setStatus(taskDto.getStatus());
                    }
                    if (taskDto.getPriority() != null) {
                        task.setPriority(taskDto.getPriority());
                    }
                    
                    task.setAssignee(taskDto.getAssignee());
                    task.setDueDate(taskDto.getDueDate());
                    
                    if ("done".equals(taskDto.getStatus()) && task.getCompletedAt() == null) {
                        task.setCompletedAt(System.currentTimeMillis());
                    } else if (!"done".equals(taskDto.getStatus())) {
                        task.setCompletedAt(null);
                    }
                    Task updatedTask = taskRepository.save(task);
                    broadcastEvent(userDetails.getUser().getId(), "UPDATE", updatedTask);
                    return ResponseEntity.ok(updatedTask);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @PathVariable String id) {
        return taskRepository.findById(id)
                .filter(t -> t.getUserId().equals(userDetails.getUser().getId()))
                .map(task -> {
                    taskRepository.delete(task);
                    broadcastEvent(userDetails.getUser().getId(), "DELETE", id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private void broadcastEvent(String userId, String action, Object payload) {
        WebSocketEvent event = WebSocketEvent.builder()
                .type("TASK")
                .action(action)
                .payload(payload)
                .build();
        messagingTemplate.convertAndSend("/topic/tasks/" + userId, event);
    }
}
