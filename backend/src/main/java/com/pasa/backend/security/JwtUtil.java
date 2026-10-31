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
    private static final String TYPE_ACCESS = "access";
    private static final String TYPE_DOWNLOAD = "download";

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
            String type = parseToken(token).get(TYPE_CLAIM, String.class);
            // Only genuine access tokens (or ones issued before the claim existed) may call the API.
            // Refresh and download tokens are single-purpose and must be refused here.
            return type == null || TYPE_ACCESS.equals(type);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * Short-lived token that lets a client open one report-card PDF from a plain URL
     * (the phone hands the URL to a PDF viewer, which cannot send an Authorization header).
     * It names exactly one report card and expires quickly.
     */
    public String generateDownloadToken(UUID reportCardId, UUID learnerId, long ttlSeconds) {
        return Jwts.builder()
                .subject(reportCardId.toString())
                .claim("lid", learnerId.toString())
                .claim(TYPE_CLAIM, TYPE_DOWNLOAD)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + ttlSeconds * 1000))
                .signWith(key)
                .compact();
    }

    /** True only for a valid, unexpired token that was issued as a download token. */
    public boolean isValidDownloadToken(String token) {
        try {
            return TYPE_DOWNLOAD.equals(parseToken(token).get(TYPE_CLAIM, String.class));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** The report card id a download token was issued for. */
    public UUID getDownloadReportCardId(String token) {
        return UUID.fromString(parseToken(token).getSubject());
    }

    /** The learner id a download token was issued for. */
    public UUID getDownloadLearnerId(String token) {
        return UUID.fromString(parseToken(token).get("lid", String.class));
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
