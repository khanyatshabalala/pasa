package com.pasa.backend.profile;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(max = 50) String firstName,
    @Size(max = 50) String lastName,
    @Size(max = 20) String phone,
    @Size(max = 150) String city,
    @Size(max = 50) String province
) {}
