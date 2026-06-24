package com.pasa.backend.mapper;

import com.pasa.backend.domain.entity.Staff;
import com.pasa.backend.dto.request.AddStaffRequest;
import com.pasa.backend.dto.response.StaffResponse;

public final class StaffMapper {

    private StaffMapper() {}

    public static StaffResponse toResponse(Staff staff) {
        return new StaffResponse(
            staff.getId(),
            staff.getUserId(),
            staff.getStaffNumber(),
            staff.getPosition()
        );
    }

    public static Staff toEntity(AddStaffRequest req) {
        Staff staff = new Staff();
        staff.setUserId(req.userId());
        staff.setStaffNumber(req.staffNumber());
        staff.setPosition(req.position());
        return staff;
    }
}
