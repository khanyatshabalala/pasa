package com.pasa.backend.controller;

import com.pasa.backend.dto.response.DistrictResponse;
import com.pasa.backend.service.DistrictService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Read-only district lookup for any authenticated user (e.g. school discovery filters).
 * Admin create/update/delete stays on AdminController.
 */
@RestController
@RequestMapping("/api/v1/districts")
public class DistrictController {

    private final DistrictService districtService;

    public DistrictController(DistrictService districtService) {
        this.districtService = districtService;
    }

    @GetMapping
    public List<DistrictResponse> listDistricts(@RequestParam(required = false) String province) {
        return districtService.listDistricts(province);
    }
}
