package com.pasa.backend.transfer;

public final class TransferMapper {

    private TransferMapper() {}

    public static TransferResponse toResponse(Transfer transfer) {
        return new TransferResponse(
            transfer.getId(),
            transfer.getLearner() != null ? transfer.getLearner().getId() : null,
            transfer.getFromSchool() != null ? transfer.getFromSchool().getId() : null,
            transfer.getToSchool() != null ? transfer.getToSchool().getId() : null,
            transfer.getReason(),
            transfer.getStatus(),
            transfer.getRequestedAt(),
            transfer.getResolvedAt()
        );
    }
}
