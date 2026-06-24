package com.pasa.backend.controller;

import com.pasa.backend.dto.request.UpdateProfileRequest;
import com.pasa.backend.dto.response.ProfileResponse;
import com.pasa.backend.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ProfileResponse getMyProfile(Authentication auth) {
        return profileService.getProfile((UUID) auth.getPrincipal());
    }

    @PutMapping
    public ProfileResponse updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest req,
            Authentication auth
    ) {
        return profileService.updateProfile((UUID) auth.getPrincipal(), req);
    }
}
