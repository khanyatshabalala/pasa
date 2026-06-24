package com.pasa.backend.mapper;

import com.pasa.backend.domain.entity.ExamTimetable;
import com.pasa.backend.dto.request.CreateExamEntryRequest;
import com.pasa.backend.dto.response.ExamEntryResponse;

public final class ExamTimetableMapper {

    private ExamTimetableMapper() {}

    public static ExamEntryResponse toResponse(ExamTimetable entry) {
        return new ExamEntryResponse(
            entry.getId(),
            entry.getSubject(),
            entry.getGradeId(),
            entry.getExamDate(),
            entry.getStartTime(),
            entry.getEndTime(),
            entry.getVenue(),
            entry.getNotes(),
            entry.getTerm()
        );
    }

    public static ExamTimetable toEntity(CreateExamEntryRequest req) {
        ExamTimetable entry = new ExamTimetable();
        entry.setSubject(req.subject());
        entry.setGradeId(req.gradeId());
        entry.setExamDate(req.examDate());
        entry.setStartTime(req.startTime());
        entry.setEndTime(req.endTime());
        entry.setVenue(req.venue());
        entry.setNotes(req.notes());
        entry.setTerm(req.term());
        return entry;
    }
}
