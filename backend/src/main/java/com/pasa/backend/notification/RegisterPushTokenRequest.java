package com.pasa.backend.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterPushTokenRequest(
    @NotBlank @Size(max = 2000) String token,
    @NotBlank @Size(max = 20)   String platform,
    @Size(max = 500) String p256dh,
    @Size(max = 500) String authKey
) {}
