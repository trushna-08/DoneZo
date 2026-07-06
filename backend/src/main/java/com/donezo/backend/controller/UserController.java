package com.donezo.backend.controller;

import com.donezo.backend.dto.PasswordUpdateRequest;
import com.donezo.backend.dto.UserResponseDto;
import com.donezo.backend.dto.UserProfileUpdateRequest;
import com.donezo.backend.model.User;
import com.donezo.backend.security.UserDetailsImpl;
import com.donezo.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PutMapping("/profile")
    public ResponseEntity<UserResponseDto> updateProfile(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody UserProfileUpdateRequest request) {
        
        User updatedUser = userService.updateProfile(userDetails.getUser().getId(), request);
        return ResponseEntity.ok(UserResponseDto.fromUser(updatedUser));
    }

    @PutMapping("/password")
    public ResponseEntity<Map<String, String>> updatePassword(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody PasswordUpdateRequest request) {
        
        userService.updatePassword(userDetails.getUser().getId(), request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Password updated successfully");
        return ResponseEntity.ok(response);
    }
}
