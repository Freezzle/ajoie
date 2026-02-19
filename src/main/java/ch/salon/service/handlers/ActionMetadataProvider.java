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

    /**
     * Retourne la clé de traduction pour l'aide contextuelle de cette action.
     * Cette clé sera traduite côté frontend et affichée dans un tooltip (desktop) ou popover (mobile).
     *
     * @return Clé i18n (ex: "action.participation.validate.help") ou null si pas d'aide
     */
    default String getHelpKey() {
        return null;
    }
}
