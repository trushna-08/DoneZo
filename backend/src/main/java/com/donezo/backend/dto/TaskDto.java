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

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    public String getDueDate() { return dueDate; }
    public void setDueDate(String dueDate) { this.dueDate = dueDate; }
}
