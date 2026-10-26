package com.pasa.backend.service;

import com.pasa.backend.domain.entity.Attendance;
import com.pasa.backend.domain.entity.Learner;
import com.pasa.backend.dto.request.RecordAttendanceRequest;
import com.pasa.backend.dto.response.AttendanceResponse;
import com.pasa.backend.mapper.AttendanceMapper;
import com.pasa.backend.repository.AttendanceRepository;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.security.LearnerAccessGuard;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepo;
    private final LearnerRepository learnerRepo;
    private final LearnerAccessGuard accessGuard;

    public AttendanceService(AttendanceRepository attendanceRepo, LearnerRepository learnerRepo,
                             LearnerAccessGuard accessGuard) {
        this.attendanceRepo = attendanceRepo;
        this.learnerRepo = learnerRepo;
        this.accessGuard = accessGuard;
    }

    public List<AttendanceResponse> getAttendance(UUID learnerId, LocalDate from, LocalDate to, UUID userId) {
        learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));
        accessGuard.assertCanAccessLearner(learnerId, userId);

        List<Attendance> records;
        if (from != null && to != null) {
            records = attendanceRepo.findByLearnerIdAndDateBetweenOrderByDateDesc(learnerId, from, to);
        } else {
            records = attendanceRepo.findByLearnerIdOrderByDateDesc(learnerId);
        }
        return records.stream().map(AttendanceMapper::toResponse).toList();
    }

    public AttendanceResponse recordAttendance(UUID learnerId, RecordAttendanceRequest req, UUID userId) {
        Learner learner = learnerRepo.findById(learnerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Learner not found"));

        if (attendanceRepo.existsByLearnerIdAndDate(learnerId, req.date())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Attendance already recorded for this date");
        }

        Attendance attendance = AttendanceMapper.toEntity(req);
        attendance.setLearner(learner);
        attendance.setRecordedBy(userId);
        return AttendanceMapper.toResponse(attendanceRepo.save(attendance));
    }

    public AttendanceResponse updateAttendance(UUID id, RecordAttendanceRequest req, UUID userId) {
        Attendance existing = attendanceRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Record not found"));

        existing.setStatus(req.status());
        existing.setNotes(req.notes());
        existing.setRecordedBy(userId);
        return AttendanceMapper.toResponse(attendanceRepo.save(existing));
    }
}
