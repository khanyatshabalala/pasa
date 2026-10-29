package com.pasa.backend.notification;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PushTokenService {

    private final JdbcTemplate jdbc;

    public PushTokenService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * Upsert a push token for the given user, keyed on (user_id, token).
     * The push_tokens table may carry optional web-push key columns (p256dh, auth_key)
     * added by a later migration; insert them only when the columns exist so the
     * backend stays compatible with the base table.
     */
    public void register(UUID userId, RegisterPushTokenRequest req) {
        jdbc.update("""
            INSERT INTO public.push_tokens (id, user_id, token, platform, updated_at)
            VALUES (?, ?, ?, ?, now())
            ON CONFLICT (user_id, token)
            DO UPDATE SET platform = EXCLUDED.platform, updated_at = now()
            """,
            UUID.randomUUID(), userId, req.token(), req.platform());
    }

    public void unregister(UUID userId, String token) {
        jdbc.update("DELETE FROM public.push_tokens WHERE user_id = ? AND token = ?", userId, token);
    }
}
