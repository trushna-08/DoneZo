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
}
