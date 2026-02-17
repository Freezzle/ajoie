package ch.salon.service.handlers;

import java.util.Collections;
import java.util.List;

public interface ActionMetadataProvider {

    default boolean needsConfirmation() {
        return false;
    }

    default List<RequiredField> getRequiredFields() {
        return Collections.emptyList();
    }
}
