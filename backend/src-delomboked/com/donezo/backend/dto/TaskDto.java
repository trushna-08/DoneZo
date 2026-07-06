package com.donezo.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class TaskDto {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @Pattern(regexp = "^(todo|in-progress|review|done)$", message = "Status must be todo, in-progress, review, or done")
    private String status;

    @Pattern(regexp = "^(low|medium|high)$", message = "Priority must be low, medium, or high")
    private String priority;

    private String assignee;
    
    private String dueDate;
}
