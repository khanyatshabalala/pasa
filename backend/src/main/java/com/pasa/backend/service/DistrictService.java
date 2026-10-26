package com.pasa.backend.service;

import com.pasa.backend.dto.response.DistrictResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DistrictService {

    private final JdbcTemplate jdbc;

    public DistrictService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<DistrictResponse> listDistricts(String province) {
        String sql;
        Object[] params;
        if (province != null && !province.isBlank()) {
            sql = "SELECT id, name, province, code FROM public.districts WHERE province = ?::sa_province ORDER BY name";
            params = new Object[]{province};
        } else {
            sql = "SELECT id, name, province, code FROM public.districts ORDER BY province, name";
            params = new Object[]{};
        }

        return jdbc.queryForList(sql, params).stream()
            .map(row -> new DistrictResponse(
                str(row.get("id")),
                str(row.get("name")),
                str(row.get("province")),
                str(row.get("code"))
            ))
            .toList();
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }
}
