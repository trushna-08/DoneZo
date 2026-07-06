package com.donezo.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for initiating 2FA with email + password.
 * User submits credentials, backend validates and initiates OTP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpInitiationRequest {
    private String email;
    private String password;
}

/**
 * DTO for 2FA OTP Initiation Response.
 * Returns PENDING status - JWT is NOT included yet.
 * OTP is sent to user's phone via SMS, NOT returned in response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpInitiationResponse {
    private String status;  // "pending_otp"
    private String message;  // "OTP sent to your registered phone"
    private String phoneLastFour;  // e.g., "****7890"
    private Integer expiresIn;  // 300 seconds (5 minutes)
    // NOTE: OTP is intentionally NOT included in response
}

/**
 * DTO for 2FA OTP Verification Request.
 * User submits the OTP they received via SMS.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpVerificationRequest {
    private String email;
    private String otp;  // 6-digit code
}

/**
 * DTO for 2FA Completion Response.
 * Returns JWT token and user data after successful OTP verification.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpVerificationResponse {
    private String token;  // JWT token (released only after OTP verification)
    private String userId;
    private String email;
    private String name;
    private String message;  // "2FA verification successful"
}
