package com.donezo.backend.model;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;
    
    @NotBlank(message = "Name cannot be empty")
    private String name;
    
    @NotBlank(message = "Email cannot be empty")
    @Email(message = "Invalid email format")
    @Indexed(unique = true)
    private String email;
    
    private String password;
    
    private String phone;
    
    private String otp;
    
    private Long otpExpiresAt;
    
    private boolean phoneVerified = false;
    
    // 2FA Fields: Track pending 2FA state for email-based login
    private String pendingOtpEmail;  // Email waiting for OTP verification (2FA)
    private Long pendingOtpExpiresAt;  // Expiry time for 2FA OTP
    private Integer otpAttempts = 0;  // Failed OTP attempt counter
    
    @CreatedDate
    private Instant createdAt;

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }

    public Long getOtpExpiresAt() { return otpExpiresAt; }
    public void setOtpExpiresAt(Long otpExpiresAt) { this.otpExpiresAt = otpExpiresAt; }

    public boolean isPhoneVerified() { return phoneVerified; }
    public void setPhoneVerified(boolean phoneVerified) { this.phoneVerified = phoneVerified; }

    public String getPendingOtpEmail() { return pendingOtpEmail; }
    public void setPendingOtpEmail(String pendingOtpEmail) { this.pendingOtpEmail = pendingOtpEmail; }

    public Long getPendingOtpExpiresAt() { return pendingOtpExpiresAt; }
    public void setPendingOtpExpiresAt(Long pendingOtpExpiresAt) { this.pendingOtpExpiresAt = pendingOtpExpiresAt; }

    public Integer getOtpAttempts() { return otpAttempts; }
    public void setOtpAttempts(Integer otpAttempts) { this.otpAttempts = otpAttempts; }
}
