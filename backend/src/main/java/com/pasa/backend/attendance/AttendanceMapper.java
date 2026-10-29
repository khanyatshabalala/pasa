package com.pasa.backend.attendance;

public final class AttendanceMapper {

    private AttendanceMapper() {}

    public static AttendanceResponse toResponse(Attendance attendance) {
        return new AttendanceResponse(
            attendance.getId(),
            attendance.getLearner() != null ? attendance.getLearner().getId() : null,
            attendance.getDate(),
            attendance.getStatus(),
            attendance.getNotes(),
            attendance.getRecordedBy(),
            attendance.getRecordedAt()
        );
    }

    public static Attendance toEntity(RecordAttendanceRequest req) {
        Attendance attendance = new Attendance();
        attendance.setDate(req.date());
        attendance.setStatus(req.status());
        attendance.setNotes(req.notes());
        return attendance;
    }
}
