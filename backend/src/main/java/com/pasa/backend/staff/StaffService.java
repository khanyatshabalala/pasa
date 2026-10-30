package com.pasa.backend.staff;

import com.pasa.backend.domain.entity.School;
import com.pasa.backend.repository.SchoolRepository;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class StaffService {

    private static final Set<String> VALID_STAFF_ROLES = Set.of("teacher", "principal", "school_admin");

    private final StaffRepository staffRepo;
    private final SchoolRepository schoolRepo;
    private final JdbcTemplate jdbc;
    private final BCryptPasswordEncoder encoder;

    public StaffService(StaffRepository staffRepo, SchoolRepository schoolRepo,
                        JdbcTemplate jdbc, BCryptPasswordEncoder encoder) {
        this.staffRepo = staffRepo;
        this.schoolRepo = schoolRepo;
        this.jdbc = jdbc;
        this.encoder = encoder;
    }

    public List<StaffResponse> getStaff(UUID schoolId) {
        schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        return staffRepo.findBySchoolId(schoolId).stream()
                .map(StaffMapper::toResponse)
                .toList();
    }

    public StaffResponse addStaff(UUID schoolId, AddStaffRequest req) {
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));
        Staff staff = StaffMapper.toEntity(req);
        staff.setSchool(school);
        return StaffMapper.toResponse(staffRepo.save(staff));
    }

    public InviteStaffResponse inviteStaff(UUID schoolId, InviteStaffRequest req) {
        // Validate school exists
        School school = schoolRepo.findById(schoolId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));

        // Validate role
        if (!VALID_STAFF_ROLES.contains(req.role())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Role must be one of: teacher, principal, school_admin");
        }

        // Check if email already exists
        List<Map<String, Object>> existing = jdbc.queryForList(
            "SELECT id FROM auth.users WHERE email = ?", req.email()
        );

        UUID userId;
        if (!existing.isEmpty()) {
            // User exists — just assign staff role
            userId = UUID.fromString(existing.get(0).get("id").toString());
        } else {
            // Create new user with a temporary password (they'll reset it)
            userId = UUID.randomUUID();
            String tempPassword = UUID.randomUUID().toString().substring(0, 12);
            String hash = encoder.encode(tempPassword);
            String fullName = req.firstName().trim() + " " + req.lastName().trim();

            jdbc.update("""
                INSERT INTO auth.users
                  (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data,
                   role, aud, created_at, updated_at)
                VALUES
                  (?, ?, ?, now(),
                   jsonb_build_object('full_name', ?, 'first_name', ?, 'last_name', ?),
                   'authenticated', 'authenticated', now(), now())
                """,
                userId, req.email(), hash, fullName, req.firstName(), req.lastName()
            );
        }

        // Assign role if not already assigned
        List<Map<String, Object>> roleExists = jdbc.queryForList(
            "SELECT id FROM public.user_roles WHERE user_id = ? AND role = ?",
            userId, req.role()
        );
        if (roleExists.isEmpty()) {
            jdbc.update(
                "INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, now())",
                UUID.randomUUID(), userId, req.role()
            );
        }

        // Add staff record
        Staff staff = new Staff();
        staff.setUserId(userId);
        staff.setSchool(school);
        staff.setStaffNumber(req.staffNumber());
        staff.setPosition(req.position());
        staffRepo.save(staff);

        return new InviteStaffResponse(
            userId.toString(),
            req.email(),
            req.role(),
            "Staff member invited successfully"
        );
    }

    public StaffResponse updateStaff(UUID id, AddStaffRequest req) {
        Staff existing = staffRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff not found"));
        existing.setPosition(req.position());
        existing.setStaffNumber(req.staffNumber());
        return StaffMapper.toResponse(staffRepo.save(existing));
    }

    public void removeStaff(UUID id) {
        Staff staff = staffRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff not found"));
        staffRepo.delete(staff);
    }
}
