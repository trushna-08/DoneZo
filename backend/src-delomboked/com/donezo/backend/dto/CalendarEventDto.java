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
}
