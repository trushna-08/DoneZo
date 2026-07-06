package com.donezo.backend.controller;

import com.donezo.backend.dto.OtpInitiationRequest;
import com.donezo.backend.dto.OtpInitiationResponse;
import com.donezo.backend.dto.OtpVerificationRequest;
import com.donezo.backend.dto.OtpVerificationResponse;
import com.donezo.backend.model.User;
import com.donezo.backend.security.AuthService;
import lombok.Data;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Data
    @Builder
    public static class AuthRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Email format is invalid")
        private String email;
        
        private String phone;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        @jakarta.validation.constraints.Pattern(
            regexp = "^(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&#]).{8,}$",
            message = "Password must contain at least 8 characters, one uppercase letter, one number, and one special character"
        )
        private String password;

        @NotBlank(message = "Name is required for registration")
        private String name; // for registration
        
        private String otp;  // for OTP verification
    }

    @Data
    @Builder
    public static class AuthResponse {
        private String token;
        private User user;
    }

    /**
     * User registration endpoint.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    /**
     * LEGACY: Standard login without 2FA.
     * Use /auth/2fa/initiate for email-based True 2FA flow.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
    
    /**
     * ========== TRUE 2FA FLOW (NEW) ==========
     * 
     * STEP 1: Initiate 2FA with email + password
     * User submits email and password.
     * Backend validates credentials, generates OTP, sends via SMS.
     * Returns PENDING status (NO JWT yet).
     * 
     * Endpoint: POST /api/auth/2fa/initiate
     * Request body: { "email": "user@example.com", "password": "Pass@123" }
     * Response: { "status": "pending_otp", "phoneLastFour": "****7890", "expiresIn": 300 }
     * 
     * Note: OTP is sent to registered phone via SMS, NOT returned in response.
     */
    @PostMapping("/2fa/initiate")
    public ResponseEntity<OtpInitiationResponse> initiate2FA(@Valid @RequestBody OtpInitiationRequest request) {
        OtpInitiationResponse response = authService.initiate2FA(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(response);
    }

    /**
     * ========== TRUE 2FA FLOW (NEW) ==========
     * 
     * STEP 2: Verify OTP and complete authentication
     * User submits the OTP they received via SMS.
     * Backend validates OTP, generates JWT token.
     * Returns JWT token (2FA complete).
     * 
     * Endpoint: POST /api/auth/2fa/verify
     * Request body: { "email": "user@example.com", "otp": "123456" }
     * Response: { "token": "eyJhbGc...", "userId": "...", "message": "2FA verification successful" }
     * 
     * Note: JWT token is only released after successful OTP verification.
     */
    @PostMapping("/2fa/verify")
    public ResponseEntity<OtpVerificationResponse> verify2FA(@Valid @RequestBody OtpVerificationRequest request) {
        OtpVerificationResponse response = authService.verify2FA(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(response);
    }

    /**
     * ========== LEGACY ENDPOINTS (for phone-based mobile auth) ==========
     */

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestParam String phone) {
        return ResponseEntity.ok(authService.sendOtp(phone));
    }
    
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestParam String phone, @RequestParam String otp) {
        return ResponseEntity.ok(authService.verifyOtp(phone, otp));
    }
    
    @PostMapping("/login-mobile")
    public ResponseEntity<?> loginMobile(@RequestParam String phone, @RequestParam String otp) {
        return ResponseEntity.ok(authService.loginWithMobile(phone, otp));
    }
}
