package com.pasa.backend.service;

import com.pasa.backend.dto.request.UpdateProfileRequest;
import com.pasa.backend.dto.response.ProfileResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class ProfileService {

    private final JdbcTemplate jdbc;

    public ProfileService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public ProfileResponse getProfile(UUID userId) {
        var rows = jdbc.queryForList(
            "SELECT id, full_name, first_name, last_name, phone, avatar_url, subscription_tier, city, province FROM public.profiles WHERE id = ?",
            userId
        );
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found");
        }
        var r = rows.get(0);
        return new ProfileResponse(
            r.get("id").toString(),
            (String) r.get("full_name"),
            (String) r.get("first_name"),
            (String) r.get("last_name"),
            (String) r.get("phone"),
            (String) r.get("avatar_url"),
            r.get("subscription_tier") != null ? r.get("subscription_tier").toString() : "free",
            (String) r.get("city"),
            (String) r.get("province")
        );
    }

    public ProfileResponse updateProfile(UUID userId, UpdateProfileRequest req) {
        String fullName = null;
        if (req.firstName() != null || req.lastName() != null) {
            fullName = ((req.firstName() != null ? req.firstName() : "") + " " +
                       (req.lastName() != null ? req.lastName() : "")).trim();
        }

        jdbc.update("""
            UPDATE public.profiles SET
                first_name = COALESCE(?, first_name),
                last_name = COALESCE(?, last_name),
                full_name = COALESCE(?, full_name),
                phone = COALESCE(?, phone),
                city = COALESCE(?, city),
                province = COALESCE(?, province),
                updated_at = now()
            WHERE id = ?
            """,
            req.firstName(), req.lastName(), fullName,
            req.phone(), req.city(), req.province(), userId
        );

        return getProfile(userId);
    }
}
