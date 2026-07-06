package com.donezo.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "events")
@CompoundIndex(name = "user_date_idx", def = "{'userId': 1, 'date': 1}")
public class CalendarEvent {
    @Id
    private String id;
    
    @NotBlank(message = "Date cannot be empty")
    private String date;
    
    private String title;
    private String description;
    private String time;
    
    @Indexed
    @NotBlank(message = "UserId cannot be empty")
    private String userId;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
