package ch.salon.service.dto;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class DuplicatePreviewDTO {
    private UUID duplicateExhibitorId;
    private UUID targetExhibitorId;
    private int differenceCount;
    private List<DuplicatePreviewFieldDTO> fields;
    private List<DuplicateMergeConflictDTO> mergeConflicts = List.of();
    private boolean mergeBlocked;
}
