package com.pasa.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    /** Claim that distinguishes short-lived access tokens from long-lived refresh tokens. */
    private static final String TYPE_CLAIM = "typ";
    private static final String TYPE_REFRESH = "refresh";

    private final SecretKey key;
    private final long expirationMs;
    private final long refreshExpirationMs;

    public JwtUtil(JwtProperties props) {
        this.key = Keys.hmacShaKeyFor(props.getSecret().getBytes(StandardCharsets.UTF_8));
        this.expirationMs = props.getExpirationMs();
        this.refreshExpirationMs = props.getRefreshExpirationMs();
    }

    public String generateToken(UUID userId, String email, String role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .claim(TYPE_CLAIM, "access")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(key)
                .compact();
    }

    /**
     * Long-lived token used only to obtain a new access token. It carries no role, so the
     * role is always re-read from the database when it is exchanged.
     */
    public String generateRefreshToken(UUID userId) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim(TYPE_CLAIM, TYPE_REFRESH)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshExpirationMs))
                .signWith(key)
                .compact();
    }

    /** True only for a valid, unexpired token that was issued as a refresh token. */
    public boolean isValidRefreshToken(String token) {
        try {
            return TYPE_REFRESH.equals(parseToken(token).get(TYPE_CLAIM, String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * True for a valid token that may authenticate API requests. Refresh tokens are rejected.
     * Tokens issued before the type claim existed have no claim and are still accepted.
     */
    public boolean isValidAccessToken(String token) {
        try {
            return !TYPE_REFRESH.equals(parseToken(token).get(TYPE_CLAIM, String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public UUID getUserId(String token) {
        return UUID.fromString(parseToken(token).getSubject());
    }

    public String getRole(String token) {
        return parseToken(token).get("role", String.class);
    }
}
