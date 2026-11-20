package ch.salon.service.dto;

import ch.salon.service.duplicate.DuplicatePreviewEffect;
import lombok.Data;

@Data
public class DuplicatePreviewFieldDTO {
    private String group;
    private String key;
    private String label;
    private String currentValue;
    private String newValue;
    private DuplicatePreviewEffect effect;
}
