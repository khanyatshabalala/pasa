package com.pasa.backend.service;

import com.pasa.backend.domain.entity.School;
import com.pasa.backend.domain.entity.SchoolClass;
import com.pasa.backend.dto.request.CreateClassRequest;
import com.pasa.backend.dto.response.ClassResponse;
import com.pasa.backend.mapper.ClassMapper;
import com.pasa.backend.repository.SchoolClassRepository;
import com.pasa.backend.repository.SchoolRepository;
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

    public ClassService(SchoolClassRepository classRepo, SchoolRepository schoolRepo) {
        this.classRepo = classRepo;
        this.schoolRepo = schoolRepo;
    }

    public List<ClassResponse> getClasses(UUID schoolId, Integer year) {
        schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        int academicYear = year != null ? year : Year.now().getValue();
        return classRepo.findBySchoolIdAndAcademicYear(schoolId, academicYear).stream()
                .map(ClassMapper::toResponse)
                .toList();
    }

    public ClassResponse createClass(UUID schoolId, CreateClassRequest req) {
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        SchoolClass schoolClass = ClassMapper.toEntity(req);
        schoolClass.setSchool(school);
        if (schoolClass.getAcademicYear() == null) {
            schoolClass.setAcademicYear(Year.now().getValue());
        }
        return ClassMapper.toResponse(classRepo.save(schoolClass));
    }

    public ClassResponse updateClass(UUID id, CreateClassRequest req) {
        SchoolClass existing = classRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
        existing.setName(req.name());
        existing.setGradeId(req.gradeId());
        existing.setTeacherUserId(req.teacherUserId());
        return ClassMapper.toResponse(classRepo.save(existing));
    }

    public void deleteClass(UUID id) {
        SchoolClass cls = classRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found"));
        classRepo.delete(cls);
    }
}
