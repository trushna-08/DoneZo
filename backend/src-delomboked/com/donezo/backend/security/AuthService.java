package com.donezo.backend.security;

import com.donezo.backend.controller.AuthController.AuthRequest;
import com.donezo.backend.controller.AuthController.AuthResponse;
import com.donezo.backend.dto.OtpInitiationResponse;
import com.donezo.backend.dto.OtpVerificationResponse;
import com.donezo.backend.model.User;
import com.donezo.backend.repository.UserRepository;
import com.donezo.backend.service.SmsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.util.Random;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final SmsService smsService;

    @Value("${otp.expiry.minutes:5}")
    private int otpExpiryMinutes;

    @Value("${otp.max-attempts:3}")
    private int maxOtpAttempts;

    public AuthResponse register(AuthRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new org.springframework.dao.DuplicateKeyException("Email is already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
            user.setPhone(request.getPhone());
        }

        userRepository.save(user);

        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        String jwt = jwtService.generateToken(userDetails, user.getId());

        AuthResponse response = new AuthResponse();
        response.setToken(jwt);
        response.setUser(user);
        
        return response;
    }

    /**
     * LEGACY: Standard login without 2FA.
     * Use `initiate2FA` for email+password based True 2FA flow.
     */
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        String jwt = jwtService.generateToken(userDetails, user.getId());

        AuthResponse response = new AuthResponse();
        response.setToken(jwt);
        response.setUser(user);

        return response;
    }

    /**
     * STEP 1 - TRUE 2FA: Initiate 2FA with email + password.
     * 
     * Flow:
     * 1. Validate email and password
     * 2. Generate 6-digit OTP
     * 3. Send OTP to user's phone via Twilio SMS
     * 4. Return PENDING status (JWT NOT released yet)
     * 
     * @param email User's email
     * @param password User's password
     * @return OTP initiation response with pending status
     */
    public OtpInitiationResponse initiate2FA(String email, String password) {
        // Step 1: Validate email and password
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
        } catch (Exception e) {
            throw new RuntimeException("Invalid email or password");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Step 2: Check if user has a phone number registered
        if (user.getPhone() == null || user.getPhone().isEmpty()) {
            throw new RuntimeException("No phone number registered. Cannot send OTP.");
        }

        // Step 3: Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        long expiryTime = System.currentTimeMillis() + (otpExpiryMinutes * 60 * 1000);

        // Step 4: Store OTP and mark as pending (NOT authenticated yet)
        user.setPendingOtpEmail(email);
        user.setOtp(otp);
        user.setPendingOtpExpiresAt(expiryTime);
        user.setOtpAttempts(0);  // Reset attempt counter
        userRepository.save(user);

        // Step 5: Send OTP via SMS (OTP is NOT included in the response)
        boolean smsSent = smsService.sendOtpSms(user.getPhone(), otp);
        if (!smsSent) {
            throw new RuntimeException("Failed to send OTP. Please try again.");
        }

        // Step 6: Return PENDING status (no JWT token)
        String phoneLastFour = user.getPhone().substring(Math.max(0, user.getPhone().length() - 4));
        return OtpInitiationResponse.builder()
                .status("pending_otp")
                .message("OTP sent to your registered phone")
                .phoneLastFour("****" + phoneLastFour)
                .expiresIn(otpExpiryMinutes * 60)
                .build();
        // NOTE: OTP is intentionally NOT included in response
    }

    /**
     * STEP 2 - TRUE 2FA: Verify OTP and complete 2FA authentication.
     * 
     * Flow:
     * 1. Find user with pending OTP
     * 2. Validate OTP matches and hasn't expired
     * 3. Check attempt count (prevent brute force)
     * 4. Generate JWT token upon successful verification
     * 5. Return token (2FA complete)
     * 
     * @param email User's email (waiting for OTP)
     * @param otp 6-digit code submitted by user
     * @return OTP verification response with JWT token
     */
    public OtpVerificationResponse verify2FA(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Step 1: Check if user has a pending OTP request
        if (user.getPendingOtpEmail() == null || !user.getPendingOtpEmail().equals(email)) {
            throw new RuntimeException("No pending OTP found. Please initiate 2FA first.");
        }

        // Step 2: Check OTP expiry
        if (user.getPendingOtpExpiresAt() == null || System.currentTimeMillis() > user.getPendingOtpExpiresAt()) {
            user.setPendingOtpEmail(null);
            user.setOtp(null);
            userRepository.save(user);
            throw new RuntimeException("OTP expired. Please request a new one.");
        }

        // Step 3: Check attempt count (prevent brute force)
        if (user.getOtpAttempts() >= maxOtpAttempts) {
            user.setPendingOtpEmail(null);
            user.setOtp(null);
            userRepository.save(user);
            throw new RuntimeException("Too many failed attempts. Please request a new OTP.");
        }

        // Step 4: Validate OTP matches
        if (user.getOtp() == null || !user.getOtp().equals(otp)) {
            user.setOtpAttempts(user.getOtpAttempts() + 1);
            userRepository.save(user);
            int remainingAttempts = maxOtpAttempts - user.getOtpAttempts();
            throw new RuntimeException("Invalid OTP. " + remainingAttempts + " attempts remaining.");
        }

        // Step 5: OTP is valid - Clear pending state and generate JWT
        user.setPendingOtpEmail(null);
        user.setOtp(null);
        user.setPendingOtpExpiresAt(null);
        user.setOtpAttempts(0);
        userRepository.save(user);

        // Step 6: Generate JWT token (2FA complete, authentication successful)
        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        String jwt = jwtService.generateToken(userDetails, user.getId());

        return OtpVerificationResponse.builder()
                .token(jwt)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .message("2FA verification successful")
                .build();
    }

    /**
     * LEGACY: Send OTP for mobile login (phone-based, not email-based 2FA).
     * OTP is sent via SMS but response exposes it (NOT SECURE for production).
     * Deprecated in favor of True 2FA flow.
     */
    public Map<String, String> sendOtp(String phone) {
        // Validate phone number format
        if (phone == null || !phone.matches("^\\+?[1-9]\\d{1,14}$")) {
            throw new IllegalArgumentException("Invalid phone number format");
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        long expiryTime = System.currentTimeMillis() + (otpExpiryMinutes * 60 * 1000);

        // Find or create user with phone
        User user = userRepository.findByPhone(phone)
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setPhone(phone);
                    return newUser;
                });

        // Store OTP
        user.setOtp(otp);
        user.setOtpExpiresAt(expiryTime);
        userRepository.save(user);

        // Send via SMS
        smsService.sendOtpSms(phone, otp);

        Map<String, String> response = new HashMap<>();
        response.put("message", "OTP sent to " + phone);
        response.put("expiresIn", otpExpiryMinutes + " minutes");
        // NOTE: OTP is NOT exposed in response (improvement over legacy code)
        return response;
    }

    /**
     * Verify OTP for mobile login (phone-based authentication).
     */
    public Map<String, Boolean> verifyOtp(String phone, String otp) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getOtp() == null || user.getOtpExpiresAt() == null) {
            throw new RuntimeException("OTP not requested");
        }

        if (System.currentTimeMillis() > user.getOtpExpiresAt()) {
            throw new RuntimeException("OTP expired");
        }

        if (!user.getOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP");
        }

        // Mark phone as verified
        user.setPhoneVerified(true);
        user.setOtp(null);
        user.setOtpExpiresAt(null);
        userRepository.save(user);

        Map<String, Boolean> response = new HashMap<>();
        response.put("verified", true);
        return response;
    }

    /**
     * Complete login with mobile OTP (phone-based authentication).
     */
    public AuthResponse loginWithMobile(String phone, String otp) {
        // Verify OTP first
        verifyOtp(phone, otp);

        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetailsImpl userDetails = new UserDetailsImpl(user);
        String jwt = jwtService.generateToken(userDetails, user.getId());

        AuthResponse response = new AuthResponse();
        response.setToken(jwt);
        response.setUser(user);

        return response;
    }
}
