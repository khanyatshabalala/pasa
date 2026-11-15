package com.pasa.backend.linkrequest;

import com.pasa.backend.domain.entity.School;
import com.pasa.backend.repository.LearnerRepository;
import com.pasa.backend.repository.ParentLinkRepository;
import com.pasa.backend.repository.SchoolRepository;
import com.pasa.backend.schoolclass.SchoolClassRepository;
import com.pasa.backend.security.SchoolAccessGuard;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LinkRequestServiceTest {

    @Mock private LinkRequestRepository linkRequestRepo;
    @Mock private SchoolRepository schoolRepo;
    @Mock private LearnerRepository learnerRepo;
    @Mock private ParentLinkRepository parentLinkRepo;
    @Mock private SchoolClassRepository classRepo;
    @Mock private SchoolAccessGuard schoolAccessGuard;

    private LinkRequestService service;

    @BeforeEach
    void setUp() {
        service = new LinkRequestService(
                linkRequestRepo, schoolRepo, learnerRepo, parentLinkRepo,
                classRepo, new JdbcTemplate(), schoolAccessGuard);
    }

    @Test
    void withdrawHidesRequestsOwnedByAnotherParent() {
        UUID requestId = UUID.randomUUID();
        LinkRequest request = pendingRequest(UUID.randomUUID());
        when(linkRequestRepo.findById(requestId)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> service.withdrawRequest(requestId, UUID.randomUUID()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        verify(linkRequestRepo, never()).save(any());
    }

    @Test
    void onlyPendingRequestsCanBeWithdrawn() {
        UUID parentId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();
        LinkRequest request = pendingRequest(parentId);
        request.setStatus("approved");
        when(linkRequestRepo.findById(requestId)).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> service.withdrawRequest(requestId, parentId))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
        verify(linkRequestRepo, never()).save(any());
    }

    @Test
    void withdrawalRecordsStatusAndTimestamp() {
        UUID parentId = UUID.randomUUID();
        UUID requestId = UUID.randomUUID();
        LinkRequest request = pendingRequest(parentId);
        when(linkRequestRepo.findById(requestId)).thenReturn(Optional.of(request));
        when(linkRequestRepo.save(request)).thenReturn(request);

        LinkRequestResponse response = service.withdrawRequest(requestId, parentId);

        assertThat(response.status()).isEqualTo("withdrawn");
        assertThat(request.getWithdrawnAt()).isNotNull();
        assertThat(request.getUpdatedAt()).isNotNull();
    }

    private static LinkRequest pendingRequest(UUID parentId) {
        School school = new School();
        school.setId(UUID.randomUUID());
        school.setName("Test School");

        LinkRequest request = new LinkRequest();
        request.setParentUserId(parentId);
        request.setSchool(school);
        request.setStatus("pending");
        return request;
    }
}
