package com.donezo.backend.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tasks")
@CompoundIndex(name = "user_status_idx", def = "{'userId': 1, 'status': 1}")
public class Task {
    @Id
    private String id;
    
    @NotBlank(message = "Title cannot be empty")
    private String title;
    
    private String description;
    private String status;
    private String priority;
    private String assignee;
    private String dueDate;
    
    @Indexed
    @NotBlank(message = "UserId cannot be empty")
    private String userId;
    
    @CreatedDate
    private Instant createdAt;
    
    @LastModifiedDate
    private Instant updatedAt;
    
    private Long completedAt; // Keep as long since UI might expect it this way for now
}
