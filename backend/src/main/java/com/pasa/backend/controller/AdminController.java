package com.pasa.backend.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    private final JdbcTemplate jdbc;

    public AdminController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ── Districts ─────────────────────────────────────────────────────────

    @GetMapping("/districts")
    public List<Map<String, Object>> listDistricts(@RequestParam(required = false) String province) {
        if (province != null) {
            return jdbc.queryForList(
                "SELECT id, name, code, province, created_at FROM public.districts WHERE province = ? ORDER BY name",
                province
            );
        }
        return jdbc.queryForList("SELECT id, name, code, province, created_at FROM public.districts ORDER BY province, name");
    }

    @PostMapping("/districts")
    public ResponseEntity<Map<String, Object>> createDistrict(@Valid @RequestBody CreateDistrictRequest req) {
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO public.districts (id, name, code, province) VALUES (?, ?, ?, ?::sa_province)",
            id, req.name(), req.code(), req.province()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id, "name", req.name()));
    }

    @PutMapping("/districts/{id}")
    public Map<String, Object> updateDistrict(@PathVariable UUID id, @Valid @RequestBody CreateDistrictRequest req) {
        int rows = jdbc.update(
            "UPDATE public.districts SET name = ?, code = ?, province = ?::sa_province, updated_at = now() WHERE id = ?",
            req.name(), req.code(), req.province(), id
        );
        if (rows == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "District not found");
        return Map.of("id", id, "name", req.name());
    }

    @DeleteMapping("/districts/{id}")
    public ResponseEntity<Void> deleteDistrict(@PathVariable UUID id) {
        int rows = jdbc.update("DELETE FROM public.districts WHERE id = ?", id);
        if (rows == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "District not found");
        return ResponseEntity.noContent().build();
    }

    // ── Users / Roles ─────────────────────────────────────────────────────

    @GetMapping("/users")
    public List<Map<String, Object>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        int offset = page * Math.min(size, 100);
        return jdbc.queryForList("""
            SELECT p.id, p.full_name, p.first_name, p.last_name, p.phone, p.subscription_tier,
                   u.email, u.created_at,
                   COALESCE(json_agg(json_build_object('role', ur.role, 'school_id', ur.school_id)) 
                     FILTER (WHERE ur.role IS NOT NULL), '[]') AS roles
            FROM public.profiles p
            JOIN auth.users u ON u.id = p.id
            LEFT JOIN public.user_roles ur ON ur.user_id = p.id
            GROUP BY p.id, u.email, u.created_at
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
            """, Math.min(size, 100), offset);
    }

    @PostMapping("/users/{userId}/roles")
    public ResponseEntity<Map<String, Object>> assignRole(
            @PathVariable UUID userId,
            @Valid @RequestBody AssignRoleRequest req
    ) {
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO public.user_roles (id, user_id, role, school_id) VALUES (?, ?, ?::app_role, ?) ON CONFLICT (user_id, role, school_id) DO NOTHING",
            id, userId, req.role(), req.schoolId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id, "userId", userId, "role", req.role()));
    }

    @DeleteMapping("/users/{userId}/roles/{roleId}")
    public ResponseEntity<Void> removeRole(@PathVariable UUID userId, @PathVariable UUID roleId) {
        int rows = jdbc.update("DELETE FROM public.user_roles WHERE id = ? AND user_id = ?", roleId, userId);
        if (rows == 0) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found");
        return ResponseEntity.noContent().build();
    }

    // ── Inner DTOs ────────────────────────────────────────────────────────

    public record CreateDistrictRequest(
        @NotBlank String name,
        String code,
        @NotBlank String province
    ) {}

    public record AssignRoleRequest(
        @NotBlank String role,
        UUID schoolId
    ) {}
}
