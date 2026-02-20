package ch.salon.service.handlers;

import java.util.Collections;
import java.util.List;

public interface ActionMetadataProvider {

    default String getConfirmationKey() {
        return null;
    }

    default List<RequiredField> getRequiredFields() {
        return Collections.emptyList();
    }

    default String getHelpKey() {
        return null;
    }
}
