package com.donezo.backend.service;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service for sending SMS messages via Twilio.
 * Responsible for OTP delivery in 2FA authentication flow.
 * 
 * OTP is NEVER returned in API responses - it's sent directly to the user's phone.
 */
@Service
public class SmsService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SmsService.class);

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.phone-number}")
    private String twilioPhoneNumber;

    /**
     * Send OTP via SMS to the user's phone number.
     * The OTP is NOT returned in the response - it's only sent to the phone.
     * 
     * @param phoneNumber User's phone number in E.164 format (e.g., +1234567890)
     * @param otp 6-digit OTP code
     * @return true if SMS was sent successfully, false otherwise
     */
    public boolean sendOtpSms(String phoneNumber, String otp) {
        try {
            // Initialize Twilio with credentials
            Twilio.init(accountSid, authToken);

            // Create the SMS message body
            String messageBody = String.format(
                "Your DoneZo 2FA verification code is: %s\n" +
                "This code expires in 5 minutes.\n" +
                "Do not share this code with anyone.",
                otp
            );

            // Send the message
            Message message = Message.creator(
                new PhoneNumber(twilioPhoneNumber),  // From number (Twilio)
                new PhoneNumber(phoneNumber),         // To number (User)
                messageBody
            ).create();

            log.info("OTP SMS sent successfully. Message SID: {}", message.getSid());
            return true;

        } catch (Exception e) {
            log.error("Failed to send OTP SMS to {}: {}", phoneNumber, e.getMessage(), e);
            // In production, implement retry logic or alert mechanism
            return false;
        }
    }

    /**
     * Send generic notification SMS (for non-OTP messages).
     * 
     * @param phoneNumber User's phone number in E.164 format
     * @param message SMS message content
     * @return true if SMS was sent successfully, false otherwise
     */
    public boolean sendNotificationSms(String phoneNumber, String message) {
        try {
            Twilio.init(accountSid, authToken);

            Message smsMessage = Message.creator(
                new PhoneNumber(twilioPhoneNumber),
                new PhoneNumber(phoneNumber),
                message
            ).create();

            log.info("Notification SMS sent successfully. Message SID: {}", smsMessage.getSid());
            return true;

        } catch (Exception e) {
            log.error("Failed to send notification SMS to {}: {}", phoneNumber, e.getMessage(), e);
            return false;
        }
    }
}
