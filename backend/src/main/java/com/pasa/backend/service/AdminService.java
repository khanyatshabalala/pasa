package com.pasa.backend.service;

import com.pasa.backend.dto.request.AssignRoleRequest;
import com.pasa.backend.dto.request.CreateDistrictRequest;
import com.pasa.backend.dto.response.AdminUserResponse;
import com.pasa.backend.dto.response.DistrictResponse;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final JdbcTemplate jdbc;

    public AdminService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ── Districts ─────────────────────────────────────────────────────────

    public List<DistrictResponse> listDistricts(String province) {
        String sql;
        Object[] params;
        if (province != null && !province.isBlank()) {
            sql = "SELECT id, name, province, created_at FROM public.districts WHERE province = ? ORDER BY name";
            params = new Object[]{province};
        } else {
            sql = "SELECT id, name, province, created_at FROM public.districts ORDER BY name";
            params = new Object[]{};
        }

        return jdbc.queryForList(sql, params).stream()
            .map(row -> new DistrictResponse(
                str(row.get("id")),
                str(row.get("name")),
                str(row.get("province")),
                str(row.get("created_at"))
            ))
            .toList();
    }

    public DistrictResponse createDistrict(CreateDistrictRequest req) {
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO public.districts (id, name, province, created_at) VALUES (?, ?, ?, now())",
            id, req.name(), req.province()
        );
        return new DistrictResponse(id.toString(), req.name(), req.province(), null);
    }

    public DistrictResponse updateDistrict(UUID id, CreateDistrictRequest req) {
        int updated = jdbc.update(
            "UPDATE public.districts SET name = ?, province = ? WHERE id = ?",
            req.name(), req.province(), id
        );
        if (updated == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "District not found");
        }
        return new DistrictResponse(id.toString(), req.name(), req.province(), null);
    }

    public void deleteDistrict(UUID id) {
        int deleted = jdbc.update("DELETE FROM public.districts WHERE id = ?", id);
        if (deleted == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "District not found");
        }
    }

    // ── Users ─────────────────────────────────────────────────────────────

    public List<AdminUserResponse> listUsers(int page, int size) {
        int offset = page * size;
        List<Map<String, Object>> users = jdbc.queryForList(
            """
            SELECT u.id, u.email,
                   u.raw_user_meta_data->>'full_name' AS full_name,
                   u.created_at
            FROM auth.users u
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
            """,
            size, offset
        );

        return users.stream().map(row -> {
            UUID userId = UUID.fromString(str(row.get("id")));
            List<String> roles = jdbc.queryForList(
                "SELECT role FROM public.user_roles WHERE user_id = ?", String.class, userId
            );
            return new AdminUserResponse(
                str(row.get("id")),
                str(row.get("email")),
                str(row.get("full_name")),
                roles,
                str(row.get("created_at"))
            );
        }).toList();
    }

    public void assignRole(UUID userId, AssignRoleRequest req) {
        // Check user exists
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT id FROM auth.users WHERE id = ?", userId
        );
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        // Check if role already assigned
        List<Map<String, Object>> existing = jdbc.queryForList(
            "SELECT id FROM public.user_roles WHERE user_id = ? AND role = ?",
            userId, req.role()
        );
        if (!existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Role already assigned");
        }

        jdbc.update(
            "INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, now())",
            UUID.randomUUID(), userId, req.role()
        );
    }

    public void removeRole(UUID userId, UUID roleId) {
        int deleted = jdbc.update(
            "DELETE FROM public.user_roles WHERE id = ? AND user_id = ?",
            roleId, userId
        );
        if (deleted == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Role assignment not found");
        }
    }

    private String str(Object obj) {
        return obj == null ? null : obj.toString();
    }
}
