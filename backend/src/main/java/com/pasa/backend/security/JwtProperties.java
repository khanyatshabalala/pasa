package com.pasa.backend.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "pasa.jwt")
public class JwtProperties {
    private String secret;
    private long expirationMs;
    /** Refresh token lifetime. Defaults to 30 days. */
    private long refreshExpirationMs = 30L * 24 * 60 * 60 * 1000;

    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public long getExpirationMs() { return expirationMs; }
    public void setExpirationMs(long expirationMs) { this.expirationMs = expirationMs; }
    public long getRefreshExpirationMs() { return refreshExpirationMs; }
    public void setRefreshExpirationMs(long refreshExpirationMs) { this.refreshExpirationMs = refreshExpirationMs; }
}
