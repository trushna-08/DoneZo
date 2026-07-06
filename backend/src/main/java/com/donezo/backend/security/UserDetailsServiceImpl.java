package com.donezo.backend.security;

import com.donezo.backend.model.User;
import com.donezo.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service

public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user;
        if (identifier.matches("^\\+?[1-9]\\d{1,14}$")) {
            user = userRepository.findByPhone(identifier)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with phone: " + identifier));
        } else {
            user = userRepository.findByEmail(identifier)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + identifier));
        }
        return new UserDetailsImpl(user);
    }
}
