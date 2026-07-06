package com.donezo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpInitiationResponse {
    private String status;
    private String message;
    private String phoneLastFour;
    private Integer expiresIn;
}
