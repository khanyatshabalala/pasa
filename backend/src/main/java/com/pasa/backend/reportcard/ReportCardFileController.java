package com.pasa.backend.reportcard;

import com.pasa.backend.storage.StorageObject;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Serves one report-card PDF for a short-lived link token (see
 * {@code POST .../report-cards/{id}/download-link}). This path is public in SecurityConfig
 * because the token is the credential; it is only valid for a single report card and expires
 * after {@link ReportCardService#DOWNLOAD_LINK_TTL_SECONDS} seconds.
 */
@RestController
@RequestMapping("/api/v1/report-card-files")
public class ReportCardFileController {

    private final ReportCardService reportCardService;

    public ReportCardFileController(ReportCardService reportCardService) {
        this.reportCardService = reportCardService;
    }

    @GetMapping("/{token}")
    public ResponseEntity<InputStreamResource> file(@PathVariable String token) {
        StorageObject object = reportCardService.downloadByToken(token);

        ResponseEntity.BodyBuilder builder = ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                // A report card is personal information: never let a browser or proxy keep a copy.
                .cacheControl(CacheControl.noStore());
        if (object.contentLength() >= 0) {
            builder.contentLength(object.contentLength());
        }
        return builder.body(new InputStreamResource(object.content()));
    }
}
