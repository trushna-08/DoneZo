package com.donezo.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CalendarEventDto {
    @NotBlank(message = "Date is required")
    private String date;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;
    private String time;

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }
}
