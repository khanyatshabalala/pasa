package com.pasa.backend.schoolclass;

import com.pasa.backend.domain.entity.School;
import com.pasa.backend.repository.SchoolRepository;
import com.pasa.backend.security.SchoolAccessGuard;
import com.pasa.backend.staff.StaffRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Year;
import java.util.List;
import java.util.UUID;

@Service
public class ClassService {

    private final SchoolClassRepository classRepo;
    private final SchoolRepository schoolRepo;
    private final SchoolAccessGuard schoolAccessGuard;
    private final StaffRepository staffRepo;

    public ClassService(
            SchoolClassRepository classRepo,
            SchoolRepository schoolRepo,
            SchoolAccessGuard schoolAccessGuard,
            StaffRepository staffRepo
    ) {
        this.classRepo = classRepo;
        this.schoolRepo = schoolRepo;
        this.schoolAccessGuard = schoolAccessGuard;
        this.staffRepo = staffRepo;
    }

    public List<ClassResponse> getClasses(UUID schoolId, Integer year, UUID userId) {
        schoolAccessGuard.assertCanAccessSchool(schoolId, userId);
        schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        int academicYear = year != null ? year : Year.now().getValue();
        return classRepo.findBySchoolIdAndAcademicYear(schoolId, academicYear).stream()
                .map(ClassMapper::toResponse)
                .toList();
    }

    public ClassResponse createClass(UUID schoolId, CreateClassRequest req, UUID userId) {
        schoolAccessGuard.assertCanManageSchool(schoolId, userId);
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        validateTeacherSchool(schoolId, req.teacherUserId());
        SchoolClass schoolClass = ClassMapper.toEntity(req);
        schoolClass.setSchool(school);
        if (schoolClass.getAcademicYear() == null) {
            schoolClass.setAcademicYear(Year.now().getValue());
        }
        return ClassMapper.toResponse(classRepo.save(schoolClass));
    }

    public ClassResponse updateClass(UUID schoolId, UUID id, CreateClassRequest req, UUID userId) {
        schoolAccessGuard.assertCanManageSchool(schoolId, userId);
        SchoolClass existing = classRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
        if (!existing.getSchool().getId().equals(schoolId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found");
        }
        validateTeacherSchool(schoolId, req.teacherUserId());
        existing.setName(req.name());
        existing.setGradeId(req.gradeId());
        existing.setTeacherUserId(req.teacherUserId());
        return ClassMapper.toResponse(classRepo.save(existing));
    }

    public void deleteClass(UUID schoolId, UUID id, UUID userId) {
        schoolAccessGuard.assertCanManageSchool(schoolId, userId);
        SchoolClass cls = classRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
        if (!cls.getSchool().getId().equals(schoolId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found");
        }
        classRepo.delete(cls);
    }

    private void validateTeacherSchool(UUID schoolId, UUID teacherUserId) {
        if (teacherUserId != null && staffRepo.findByUserIdAndSchoolId(teacherUserId, schoolId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Teacher must belong to this school");
        }
    }
}
