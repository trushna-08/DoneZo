package com.donezo.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    @Size(min = 2, max = 60, message = "Name must be between 2 and 60 characters")
    private String name;

    @Email(message = "Email format is invalid")
    private String email;

    @Pattern(regexp = "^$|^\\+?[0-9]{10,15}$", message = "Phone number format is invalid")
    private String phone;
}
