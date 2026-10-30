package com.pasa.backend.staff;


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
