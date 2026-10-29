package com.pasa.backend.reportcard;

import com.pasa.backend.storage.StorageObject;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/learners/{learnerId}/report-cards")
public class ReportCardController {

    private final ReportCardService reportCardService;

    public ReportCardController(ReportCardService reportCardService) {
        this.reportCardService = reportCardService;
    }

    @GetMapping
    public List<ReportCardResponse> list(@PathVariable UUID learnerId, Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();
        return reportCardService.listByLearner(learnerId, userId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ReportCardResponse> upload(
            @PathVariable UUID learnerId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("term") Integer term,
            @RequestParam("academicYear") Integer academicYear,
            @RequestParam(value = "notes", required = false) String notes,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();
        ReportCardResponse created = reportCardService.upload(learnerId, file, term, academicYear, notes, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> download(
            @PathVariable UUID learnerId,
            @PathVariable UUID id,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();
        StorageObject object = reportCardService.download(learnerId, id, userId);

        ResponseEntity.BodyBuilder builder = ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline");
        if (object.contentLength() >= 0) {
            builder.contentLength(object.contentLength());
        }
        return builder.body(new InputStreamResource(object.content()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','PRINCIPAL','SCHOOL_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID learnerId, @PathVariable UUID id, Authentication auth) {
        reportCardService.delete(learnerId, id, (UUID) auth.getPrincipal());
        return ResponseEntity.noContent().build();
    }
}
